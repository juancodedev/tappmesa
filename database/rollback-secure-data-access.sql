-- database/rollback-secure-data-access.sql
--
-- SDD change: fix-critical-security-posture · split 2 (`rls-lockdown-flip`) · task 2.2
-- Reverse DDL for database/secure-data-access.sql — restores the pre-lockdown
-- (legacy) security posture. ONE transaction.
--
-- What it does:
--   1. Drops EVERY public-schema policy (new claim set + any residue) — the
--      legacy/archived scripts re-created afterwards restore the USING(true) /
--      latch / auth.uid() posture.
--   2. Drops the claim helpers (app_claim_tenant_id / app_is_super_admin /
--      app_claim_direct_policies).
--   3. Re-grants PUBLIC EXECUTE on the analytics SECURITY DEFINER family and
--      revokes the authenticated-only grant on get_top_products.
--   4. Restores the legacy table grants (Supabase defaults: full anon +
--      authenticated on every table).
--   5. Restores the ORIGINAL get_top_products body (archived copy, identical to
--      database/functions.sql) before the legacy functions re-apply.
--
-- After this file, the operator MUST re-apply the archived/kept legacy scripts
-- (database/archive/*.sql + database/functions.sql etc.) to recreate the dropped
-- functions/triggers/policies — see the OPERATOR NOTES at the end. The smoke
-- harness (smoke/master.mjs) does this automatically by replaying sql-src/0001..0017.
--
-- Reversibility guarantee (design §4): grants/policies/functions/triggers fully
-- reversible; additive columns (idempotency_key, capability_token, unique
-- indexes) are backward-compatible and kept.

BEGIN;

-- =============================================================================
-- 1. DROP ALL PUBLIC POLICIES (full sweep — reset to a blank RLS slate)
-- =============================================================================
DO $$
DECLARE
  p RECORD;
  n INTEGER := 0;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'rollback-secure-data-access: dropped % policies (full sweep)', n;
END $$;

-- =============================================================================
-- 2. DROP CLAIM HELPERS
-- =============================================================================
DROP FUNCTION IF EXISTS public.app_claim_tenant_id();
DROP FUNCTION IF EXISTS public.app_is_super_admin();
DROP FUNCTION IF EXISTS public.app_claim_direct_policies();

-- =============================================================================
-- 3. RESTORE ANALYTICS EXECUTE POSTURE (legacy: PUBLIC executes everything)
-- =============================================================================
GRANT EXECUTE ON FUNCTION public.get_top_products(uuid, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_sales_metrics(uuid, date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_low_stock_alerts(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_customer_metrics(uuid, integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_sales_report(uuid, date, date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_sessions() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_open(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, varchar, varchar) TO PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_top_products(uuid, integer) FROM authenticated;

-- =============================================================================
-- 4. RESTORE LEGACY TABLE GRANTS (Supabase collection defaults)
-- =============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- =============================================================================
-- 5. RESTORE ORIGINAL get_top_products (archived body — same as database/functions.sql)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_top_products(tenant_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  total_quantity BIGINT,
  total_revenue NUMERIC,
  category_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue,
    c.name as category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.tenant_id = tenant_id_param
    AND o.status IN ('completed', 'delivered')
  GROUP BY p.id, p.name, c.name
  ORDER BY total_quantity DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- =============================================================================
-- OPERATOR NOTES (real-environment rollback, in order):
--   1. psql -f database/rollback-secure-data-access.sql
--   2. psql -f database/archive/01-SETUP-ESENCIAL.sql
--      psql -f database/archive/02-SETUP-ESENCIAL-SEGURO.sql
--      psql -f database/archive/add-qr-expiration.sql
--      psql -f database/add-waiter-role.sql
--      psql -f database/archive/setup-rls.sql
--      psql -f database/archive/fix-rls-orders.sql
--      psql -f database/archive/fix-rls-tables.sql
--      psql -f database/archive/fix-tables-rls-tenant-isolation.sql
--      psql -f database/archive/fix-rls-customer-history.sql
--      psql -f database/archive/fix-reset-token-function.sql
--   3. Kept (still in database/): create-table-statuses.sql,
--      migrate-to-secure-auth.sql, create-loyalty-system.sql, functions.sql —
--      re-apply them in that order to restore the dropped table-status /
--      reset-token / loyalty / analytics functions and triggers.
-- The smoke harness does steps 2-3 automatically (replays sql-src/0001..0017,
-- which are the patched copies of these very files).
-- =============================================================================