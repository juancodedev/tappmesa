-- ============================================================
-- create-waiter-calls.sql
-- call-waiter Delivery 1 — task T1 (odd/tasks/call-waiter.md)
--
-- A seated customer calls the waiter from the table flow; waiters and
-- tenant admins see pending calls (Supabase Realtime) and mark them
-- attended.
--
-- Design:
--   * Customers NEVER touch waiter_calls directly (no anon grants). The
--     /api/waiter-calls route authorizes the table-session capability and
--     calls tappmesa_request_waiter_call() with service_role.
--   * Staff (claim JWT) read their tenant's calls and may only flip
--     status pending -> attended. resolved_at / resolved_by are stamped by
--     a trigger from the JWT claims, never trusted from the client.
--     Roles: waiter, staff (legacy waiter), tenant_admin, super_admin.
--   * One pending call per table session: partial unique index plus a
--     row lock on the table session inside the request function.
--   * Expiry is lazy: a pending call stops counting once expires_at
--     (created_at + 5 minutes) passes; the request function flips those
--     rows to 'expired' before deciding.
--   * Cooldown: 60 seconds after a cancelled or attended call. It does not
--     apply after an expiry (the customer already waited 5 minutes).
--
-- Rollback: rollback-create-waiter-calls.sql
-- ============================================================

BEGIN;

-- 1. Per-tenant toggle (S7). Anon already has table-level SELECT on tenants,
--    so the public table flow can read it.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS waiter_calls_enabled boolean NOT NULL DEFAULT true;

-- 2. Table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid        NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  table_id          uuid        NOT NULL REFERENCES public.tables (id) ON DELETE CASCADE,
  table_session_id  uuid        NOT NULL REFERENCES public.table_sessions (id) ON DELETE CASCADE,
  reason            text        NOT NULL DEFAULT 'assistance'
                                CHECK (reason IN ('assistance', 'bill', 'other')),
  status            text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'attended', 'cancelled', 'expired')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  resolved_at       timestamptz,
  resolved_by       uuid        REFERENCES public.admin_users (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS waiter_calls_one_pending_per_session
  ON public.waiter_calls (table_session_id)
  WHERE status = 'pending';

-- Staff list: pending calls of a tenant, oldest first.
CREATE INDEX IF NOT EXISTS waiter_calls_tenant_pending_idx
  ON public.waiter_calls (tenant_id, created_at)
  WHERE status = 'pending';

-- Customer view and cooldown lookup: latest call of a session.
CREATE INDEX IF NOT EXISTS waiter_calls_session_created_idx
  ON public.waiter_calls (table_session_id, created_at DESC);

-- 3. Claim helpers
CREATE OR REPLACE FUNCTION public.app_claim_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_role';
$$;

CREATE OR REPLACE FUNCTION public.app_can_handle_waiter_call(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (p_tenant_id = public.app_claim_tenant_id()
          AND public.app_claim_role() IN ('waiter', 'staff', 'tenant_admin'))
         OR coalesce(public.app_is_super_admin(), false);
$$;

-- 4. Grants and RLS (S10)
REVOKE ALL ON public.waiter_calls FROM anon, authenticated;
GRANT SELECT, UPDATE (status) ON public.waiter_calls TO authenticated;
GRANT ALL ON public.waiter_calls TO service_role;

ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waiter_calls_staff_select ON public.waiter_calls;
CREATE POLICY waiter_calls_staff_select ON public.waiter_calls
  FOR SELECT TO authenticated
  USING (public.app_can_handle_waiter_call(tenant_id));

DROP POLICY IF EXISTS waiter_calls_staff_resolve ON public.waiter_calls;
CREATE POLICY waiter_calls_staff_resolve ON public.waiter_calls
  FOR UPDATE TO authenticated
  -- An expired-but-still-pending call is not attendable: attending it would
  -- start the customer's 60-second cooldown after they already waited.
  USING (public.app_can_handle_waiter_call(tenant_id) AND status = 'pending' AND expires_at > now())
  WITH CHECK (public.app_can_handle_waiter_call(tenant_id) AND status = 'attended');

-- 5. Resolution stamp: resolved_at always set by the server; resolved_by
--    from the staff claim (NULL for service_role cancels/expiries).
CREATE OR REPLACE FUNCTION public.waiter_calls_stamp_resolution()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'pending' THEN
    NEW.resolved_at := coalesce(NEW.resolved_at, now());
    IF NEW.status = 'attended' THEN
      NEW.resolved_by := nullif(
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_user_id',
        ''
      )::uuid;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS waiter_calls_stamp_resolution ON public.waiter_calls;
CREATE TRIGGER waiter_calls_stamp_resolution
  BEFORE UPDATE ON public.waiter_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.waiter_calls_stamp_resolution();

-- 6. Request function (S4-S7). Raises:
--    INVALID_REASON, SESSION_NOT_ACTIVE, WAITER_CALLS_DISABLED,
--    WAITER_CALL_COOLDOWN (DETAIL = seconds to wait).
--    Returns the pending call: the existing one when already pending.
CREATE OR REPLACE FUNCTION public.tappmesa_request_waiter_call(
  p_table_session_id uuid,
  p_reason           text DEFAULT 'assistance'
)
RETURNS SETOF public.waiter_calls
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_session      public.table_sessions%ROWTYPE;
  v_enabled      boolean;
  v_existing     public.waiter_calls%ROWTYPE;
  v_last_resolved timestamptz;
  v_wait         int;
  v_reason       text := coalesce(p_reason, 'assistance');
BEGIN
  IF v_reason NOT IN ('assistance', 'bill', 'other') THEN
    RAISE EXCEPTION 'INVALID_REASON';
  END IF;

  -- Serialize concurrent requests of the same table session.
  SELECT * INTO v_session
    FROM public.table_sessions
   WHERE id = p_table_session_id
     FOR UPDATE;

  IF NOT FOUND OR v_session.status IS DISTINCT FROM 'active' OR v_session.ended_at IS NOT NULL
     OR v_session.table_id IS NULL OR v_session.tenant_id IS NULL THEN
    RAISE EXCEPTION 'SESSION_NOT_ACTIVE';
  END IF;

  SELECT waiter_calls_enabled INTO v_enabled
    FROM public.tenants
   WHERE id = v_session.tenant_id;

  IF NOT coalesce(v_enabled, false) THEN
    RAISE EXCEPTION 'WAITER_CALLS_DISABLED';
  END IF;

  -- Lazy expiry (S6).
  UPDATE public.waiter_calls
     SET status = 'expired', resolved_at = expires_at
   WHERE table_session_id = p_table_session_id
     AND status = 'pending'
     AND expires_at <= now();

  -- One pending call per session (S4): return the existing one.
  SELECT * INTO v_existing
    FROM public.waiter_calls
   WHERE table_session_id = p_table_session_id
     AND status = 'pending';

  IF FOUND THEN
    RETURN NEXT v_existing;
    RETURN;
  END IF;

  -- Cooldown after cancelled/attended (S5); not after expired (S6).
  SELECT max(resolved_at) INTO v_last_resolved
    FROM public.waiter_calls
   WHERE table_session_id = p_table_session_id
     AND status IN ('cancelled', 'attended');

  IF v_last_resolved IS NOT NULL AND v_last_resolved > now() - interval '60 seconds' THEN
    v_wait := ceil(extract(epoch FROM (v_last_resolved + interval '60 seconds' - now())))::int;
    RAISE EXCEPTION 'WAITER_CALL_COOLDOWN' USING DETAIL = greatest(v_wait, 1)::text;
  END IF;

  RETURN QUERY
    INSERT INTO public.waiter_calls (tenant_id, table_id, table_session_id, reason)
    VALUES (v_session.tenant_id, v_session.table_id, p_table_session_id, v_reason)
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.tappmesa_request_waiter_call(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tappmesa_request_waiter_call(uuid, text) TO service_role;

-- 7. Realtime (S9): postgres_changes events are filtered by the SELECT policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waiter_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.waiter_calls;
  END IF;
END;
$$;

COMMIT;
