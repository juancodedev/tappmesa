-- ============================================================
-- rollback-create-waiter-calls.sql
-- Reverts create-waiter-calls.sql. Deletes every waiter call.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waiter_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.waiter_calls;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.tappmesa_request_waiter_call(uuid, text);
DROP TABLE IF EXISTS public.waiter_calls;
DROP FUNCTION IF EXISTS public.waiter_calls_stamp_resolution();
DROP FUNCTION IF EXISTS public.app_can_handle_waiter_call(uuid);
DROP FUNCTION IF EXISTS public.app_claim_role();

ALTER TABLE public.tenants DROP COLUMN IF EXISTS waiter_calls_enabled;

COMMIT;
