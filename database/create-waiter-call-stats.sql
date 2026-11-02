-- database/create-waiter-call-stats.sql
--
-- Waiter call attention times for /admin/analytics.
--
-- get_waiter_call_stats(p_tenant_id, p_from, p_to) returns one jsonb document
-- for the calls created in the half-open range [p_from, p_to).
-- p_tenant_id = NULL means "all locals" (super admin only).
--
-- SECURITY: SECURITY INVOKER on purpose, like get_analytics. The caller's RLS
-- (waiter_calls_staff_select) keeps scoping rows; the role check mirrors the
-- UI permission analytics:read (tenant_admin, super_admin).
--
-- Metric definitions:
--   wait time      resolved_at - created_at of an 'attended' call, in seconds
--   summary        total calls, attended, expired, cancelled, pending, and the
--                  average / median / max wait time of the attended calls
--   expired        status 'expired', plus 'pending' calls already past
--                  expires_at that no new call has swept yet
--   by_staff       per resolved_by (the staff user who marked it attended):
--                  attended count and average / median / max wait time.
--                  staff_id is NULL when the user is unknown or was deleted;
--                  the UI resolves names through /api/admin/users.
--
-- Requires create-waiter-calls.sql. Re-runnable.
-- Rollback: database/rollback-create-waiter-call-stats.sql.

BEGIN;

-- Range filter. Plain CREATE INDEX briefly blocks writes on waiter_calls.
CREATE INDEX IF NOT EXISTS waiter_calls_tenant_created_idx
  ON public.waiter_calls (tenant_id, created_at);

CREATE OR REPLACE FUNCTION public.get_waiter_call_stats(
  p_tenant_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_role';
  v_result jsonb;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('tenant_admin', 'super_admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF NOT coalesce(public.app_is_super_admin(), false)
     AND (p_tenant_id IS NULL OR p_tenant_id IS DISTINCT FROM public.app_claim_tenant_id()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to <= p_from THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = '22023';
  END IF;

  WITH scoped AS (
    SELECT c.status,
           c.resolved_by,
           c.expires_at,
           extract(epoch FROM resolved_at - created_at) AS wait_seconds
    FROM waiter_calls c
    WHERE (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
      AND c.created_at >= p_from
      AND c.created_at < p_to
  ),
  attended AS (
    SELECT * FROM scoped WHERE status = 'attended' AND wait_seconds IS NOT NULL
  ),
  summary AS (
    SELECT jsonb_build_object(
      'total', (SELECT count(*) FROM scoped),
      'attended', count(*),
      'expired', (SELECT count(*) FROM scoped
                  WHERE status = 'expired'
                     OR (status = 'pending' AND expires_at <= now())),
      'cancelled', (SELECT count(*) FROM scoped WHERE status = 'cancelled'),
      'pending', (SELECT count(*) FROM scoped WHERE status = 'pending' AND expires_at > now()),
      'avg_seconds', round(avg(wait_seconds))::int,
      'median_seconds', round(percentile_cont(0.5) WITHIN GROUP (ORDER BY wait_seconds))::int,
      'max_seconds', round(max(wait_seconds))::int
    ) AS doc
    FROM attended
  ),
  by_staff AS (
    SELECT resolved_by,
           count(*) AS attended,
           round(avg(wait_seconds))::int AS avg_seconds,
           round(percentile_cont(0.5) WITHIN GROUP (ORDER BY wait_seconds))::int AS median_seconds,
           round(max(wait_seconds))::int AS max_seconds
    FROM attended
    GROUP BY resolved_by
  )
  SELECT jsonb_build_object(
    'summary', (SELECT doc FROM summary),
    'by_staff', coalesce(
      (SELECT jsonb_agg(jsonb_build_object(
                'staff_id', resolved_by,
                'attended', attended,
                'avg_seconds', avg_seconds,
                'median_seconds', median_seconds,
                'max_seconds', max_seconds)
              ORDER BY avg_seconds, attended DESC)
       FROM by_staff),
      '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_waiter_call_stats(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_waiter_call_stats(uuid, timestamptz, timestamptz) TO authenticated;

COMMIT;
