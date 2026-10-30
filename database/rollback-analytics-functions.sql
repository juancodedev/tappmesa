-- database/rollback-analytics-functions.sql
--
-- Reverts database/analytics-functions.sql. Afterwards
-- scripts/verify-analytics.sql must FAIL again (A1_function_exists).

DROP FUNCTION IF EXISTS public.get_analytics(uuid, timestamptz, timestamptz);
DROP INDEX IF EXISTS public.idx_orders_tenant_created_at;
DROP INDEX IF EXISTS public.idx_order_items_order_id;
