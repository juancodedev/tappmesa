-- Rollback of database/create-waiter-call-stats.sql. Waiter calls are kept.
BEGIN;
DROP FUNCTION IF EXISTS public.get_waiter_call_stats(uuid, timestamptz, timestamptz);
DROP INDEX IF EXISTS public.waiter_calls_tenant_created_idx;
COMMIT;
