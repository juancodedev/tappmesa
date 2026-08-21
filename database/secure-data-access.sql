-- database/secure-data-access.sql
--
-- SDD change: fix-critical-security-posture · split 2 (`rls-lockdown-flip`) · task 2.1
-- Claim-scoped RLS lockdown — ONE transaction, ordering per design §4.
--
--   DROP policies (introspective sweep, completeness for live-only scripts)
--   → DROP functions (triggers first) → REVOKE EXECUTE (analytics family)
--   → REVOKE/GRANT (D13 matrix) → RLS enable → claim helpers → claim policies
--   → indexes confirm → COMMIT
--
-- Design refs: D8 (loyalty drop), D9 (table_statuses fns drop), D10 (QR residue drop),
-- D11 (analytics REVOKE + claim-guarded get_top_products), D12 (latch infra drop),
-- D13 (grants matrix, incl. stock_* TO authenticated for live triggers), §4 steps 1-8.
--
-- Reversible: run database/rollback-secure-data-access.sql (reverse DDL + archived
-- objects re-created from database/archive/).

BEGIN;

-- =============================================================================
-- 1. INTROSPECTIVE POLICY DROP SWEEP (completeness guarantee; design §4.1, R2-4)
--    Drops every public-schema policy that is:
--      * bare-`true` (USING/WITH CHECK = true)
--      * auth.uid()- or latch-based (get_current_tenant_id / is_tenant_admin)
--      * name-matched to the legacy inventory:
--        %_all, %_tenant_access, orders_tenant_based_%, %_tenant_%, %_authenticated,
--        tenants_%, admin_users_%, admin_sessions_all, role_permissions_all,
--        and the 7 quoted loyalty/coupon/campaign names.
-- =============================================================================
DO $$
DECLARE
  p RECORD;
  n INTEGER := 0;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    IF p.qual ~ '^\s*\(?\s*true\s*\)?\s*$'
       OR p.with_check ~ '^\s*\(?\s*true\s*\)?\s*$'
       OR COALESCE(p.qual, '') LIKE '%auth.uid%'
       OR COALESCE(p.with_check, '') LIKE '%auth.uid%'
       OR COALESCE(p.qual, '') LIKE '%get_current_tenant_id%'
       OR COALESCE(p.with_check, '') LIKE '%get_current_tenant_id%'
       OR COALESCE(p.qual, '') LIKE '%is_tenant_admin%'
       OR COALESCE(p.with_check, '') LIKE '%is_tenant_admin%'
       OR p.policyname LIKE '%\_all' ESCAPE '\'
       OR p.policyname LIKE '%\_tenant\_access' ESCAPE '\'
       OR p.policyname LIKE 'orders\_tenant\_based\_%' ESCAPE '\'
       OR p.policyname LIKE '%\_tenant\_%' ESCAPE '\'
       OR p.policyname LIKE '%\_authenticated' ESCAPE '\'
       OR p.policyname LIKE 'tenants\_%' ESCAPE '\'
       OR p.policyname LIKE 'admin\_users\_%' ESCAPE '\'
       OR p.policyname LIKE 'admin\_sessions\_all' ESCAPE '\'
       OR p.policyname = 'role_permissions_all'
       OR p.policyname IN (
         'Allow tenant admins to manage loyalty programs',
         'Allow tenant admins to view customer loyalty',
         'Allow tenant admins to manage coupons',
         'Allow tenant admins to manage customer coupons',
         'Allow tenant admins to view loyalty transactions',
         'Allow tenant admins to manage campaigns',
         'Allow tenant admins to view campaign recipients'
       )
    THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
      n := n + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'secure-data-access: dropped % legacy policies (introspective sweep)', n;
END $$;

-- =============================================================================
-- 2. DROP FUNCTIONS (design D8/D9/D10/D12/D14; triggers before functions)
-- =============================================================================
DROP FUNCTION IF EXISTS public.get_current_tenant_id();
DROP FUNCTION IF EXISTS public.is_tenant_admin(uuid);
DROP FUNCTION IF EXISTS public.set_tenant_context(uuid, uuid);
DROP FUNCTION IF EXISTS public.clear_tenant_context();
DROP FUNCTION IF EXISTS public.create_tenant_policies(text);
DROP FUNCTION IF EXISTS public.generate_password_reset_token(varchar);
DROP FUNCTION IF EXISTS public.is_qr_code_expired(uuid);
DROP FUNCTION IF EXISTS public.regenerate_table_qr_code(uuid, varchar);
DROP FUNCTION IF EXISTS public.update_table_status(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_next_table_status(uuid);

-- R2-2 neutralization: loyalty trigger drops BEFORE the customer grants regress
DROP TRIGGER IF EXISTS trigger_add_loyalty_points ON orders;
DROP FUNCTION IF EXISTS public.add_loyalty_points_on_order();

-- =============================================================================
-- 3. REVOKE EXECUTE — analytics SECURITY DEFINER family (design D11):
--    zero PUBLIC execute over order-derived data at the flip moment.
--    Order: revoke PUBLIC first, then claim-guard + grant get_top_products to
--    authenticated (its only live caller: analyticsService.getTopProducts).
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public.get_top_products(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_daily_sales_metrics(uuid, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_low_stock_alerts(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_customer_metrics(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sales_report(uuid, date, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_sessions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_business_open(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.user_has_permission(uuid, varchar, varchar) FROM PUBLIC;

-- Claim-guard get_top_products: same tenant OR super_admin only (design D11).
CREATE OR REPLACE FUNCTION public.get_top_products(tenant_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  total_quantity BIGINT,
  total_revenue NUMERIC,
  category_name VARCHAR
) AS $$
BEGIN
  IF NOT (public.app_claim_tenant_id() = tenant_id_param OR public.app_is_super_admin()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
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

GRANT EXECUTE ON FUNCTION public.get_top_products(uuid, integer) TO authenticated;

-- =============================================================================
-- 4. REVOKE / GRANT MATRIX (design D13)
--    Claim tables (zero anon; authenticated claim-scoped full CRUD)
--    Server-only tables (zero anon + authenticated — service role only)
--    Menu tables (scoped anon reads; authenticated claim-scoped full CRUD)
--    NOTE: pre_bills / surveys / tenant_subscriptions ARE claim tables here
--    (live staff consumers via preBillService / PreBillSettings /
--    planLimitsService / SuperAdminTenantsManager); RLS is ENABLED on them in
--    step 5 so the claim policies are actually enforced (closes design S-B3).
-- =============================================================================
REVOKE ALL ON
  orders, order_items, table_sessions, customers, customer_order_history,
  table_statuses, tenant_settings, business_hours, stock_inventory,
  stock_movements, stock_alerts, suppliers, pre_bills, surveys,
  tenant_subscriptions
FROM anon, authenticated;

REVOKE ALL ON
  admin_users, admin_sessions, admin_audit_logs, password_reset_tokens,
  role_permissions, profiles, loyalty_programs, customer_loyalty, coupons,
  customer_coupons, loyalty_transactions, marketing_campaigns,
  campaign_recipients, inventory, inventory_movements, restaurant_tables,
  survey_responses
FROM anon, authenticated;

-- plan catalog: global read for authenticated (embed in tenant_subscriptions reads)
REVOKE ALL ON subscription_plans FROM anon;
GRANT SELECT ON subscription_plans TO authenticated;

-- Menu reads (existing public flow, design D13)
GRANT SELECT ON tenants, products, categories, tables TO anon;
GRANT SELECT, INSERT, UPDATE ON reservations TO anon;

-- Staff/authenticated claim-scoped CRUD (claim tables + menu tables)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  tenants, products, categories, tables,
  orders, order_items, table_sessions, customers, customer_order_history,
  table_statuses, tenant_settings, business_hours, stock_inventory,
  stock_movements, stock_alerts, suppliers, pre_bills, surveys,
  tenant_subscriptions
TO authenticated;

-- =============================================================================
-- 5. RLS ENABLE (where not already; server-only tables get zero policies)
-- =============================================================================
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CLAIM HELPERS (design D12 replacement; PG16-verified null-guard pattern)
--    auth.uid() is NEVER used (dead under custom JWT auth).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.app_claim_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_tenant_id')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.app_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_role') = 'super_admin';
$$;

-- =============================================================================
-- 7. CLAIM POLICIES (design §4.6)
--    Direct tenant_id tables: tenant_id = claim OR super_admin (FOR ALL).
--    join tables (no tenant_id): order_items / customer_order_history via orders.
--    Menu tables: anon scoped reads + authenticated claim-scoped FOR ALL.
--    Reservations: anon SELECT/INSERT status='confirmed' (unchanged behavior).
-- =============================================================================

-- orders
DROP POLICY IF EXISTS orders_claim ON orders;
CREATE POLICY orders_claim ON orders
  FOR ALL TO authenticated
  USING (tenant_id = app_claim_tenant_id() OR app_is_super_admin())
  WITH CHECK (tenant_id = app_claim_tenant_id() OR app_is_super_admin());

-- order_items (no tenant_id — join via orders)
DROP POLICY IF EXISTS order_items_claim ON order_items;
CREATE POLICY order_items_claim ON order_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND (o.tenant_id = app_claim_tenant_id() OR app_is_super_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = order_items.order_id
      AND (o.tenant_id = app_claim_tenant_id() OR app_is_super_admin())
  ));

-- customer_order_history (no tenant_id — join via orders)
DROP POLICY IF EXISTS customer_order_history_claim ON customer_order_history;
CREATE POLICY customer_order_history_claim ON customer_order_history
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = customer_order_history.order_id
      AND (o.tenant_id = app_claim_tenant_id() OR app_is_super_admin())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = customer_order_history.order_id
      AND (o.tenant_id = app_claim_tenant_id() OR app_is_super_admin())
  ));

-- direct tenant_id claim tables
CREATE OR REPLACE FUNCTION public.app_claim_direct_policies()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'table_sessions','customers','table_statuses','tenant_settings','business_hours',
    'stock_inventory','stock_movements','stock_alerts','suppliers','pre_bills',
    'surveys','tenant_subscriptions','products','categories','tables'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_claim ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_claim ON %I FOR ALL TO authenticated
         USING (tenant_id = app_claim_tenant_id() OR app_is_super_admin())
         WITH CHECK (tenant_id = app_claim_tenant_id() OR app_is_super_admin())',
      tbl, tbl);
  END LOOP;
END;
$$;
SELECT public.app_claim_direct_policies();
DROP FUNCTION public.app_claim_direct_policies();

-- tenants (no tenant_id column — id IS the tenant scope)
DROP POLICY IF EXISTS tenant_claim ON tenants;
CREATE POLICY tenant_claim ON tenants
  FOR ALL TO authenticated
  USING (id = app_claim_tenant_id() OR app_is_super_admin())
  WITH CHECK (id = app_claim_tenant_id() OR app_is_super_admin());

-- inventory / inventory_movements / restaurant_tables: server-only (RLS on, zero policies)

-- menu anon policies
DROP POLICY IF EXISTS tenant_anon_select ON tenants;
CREATE POLICY tenant_anon_select ON tenants
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS products_anon_select ON products;
CREATE POLICY products_anon_select ON products
  FOR SELECT TO anon
  USING (is_available = true);

DROP POLICY IF EXISTS categories_anon_select ON categories;
CREATE POLICY categories_anon_select ON categories
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS tables_anon_select ON tables;
CREATE POLICY tables_anon_select ON tables
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS reservations_anon_select ON reservations;
CREATE POLICY reservations_anon_select ON reservations
  FOR SELECT TO anon
  USING (status = 'confirmed');

DROP POLICY IF EXISTS reservations_anon_insert ON reservations;
CREATE POLICY reservations_anon_insert ON reservations
  FOR INSERT TO anon
  WITH CHECK (status = 'confirmed');

-- =============================================================================
-- 8. INDEXES CONFIRM (schema add since split 1; idempotent re-affirm)
-- =============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_capability_token_key ON table_sessions (capability_token);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key ON orders (idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders (order_number);

COMMIT;