-- scripts/verify-rls-lockdown.sql
--
-- SEC-005 day-of gate / S2 verification (tasks 2.1 & 2.8, design §4/§8/§12).
--
-- PURPOSE:
--   Prove the claim-scoped RLS lockdown (database/secure-data-access.sql) is in
--   force: zero bare-`true` / auth.uid() / latch-base policies remain, the named
--   legacy inventory is gone, latch/reset-token/QR/table-status/loyalty functions
--   are dropped, claim helpers + claim policies exist, the grants matrix matches
--   design D13, the function-EXECUTE lockdown holds, and the functional matrices
--   (anon = 0 rows, staff claims = own-tenant only, super_admin = all, trigger
--   smoke) behave exactly as designed.
--
-- TDD ROLE:
--   * RED: run against the pre-lockdown legacy state (or the local replay) — must
--     FAIL with a listed set of violated gates.
--   * GREEN: run after secure-data-access.sql — must end with ALL GATES PASSED.
--   * ROLLBACK proof: run after rollback-secure-data-access.sql — must FAIL again.
--
-- WHERE TO RUN:
--   * PART A (static gates) is READ-ONLY and prod-safe (pg_catalog reads).
--   * PART B (functional gates) creates a `gate_user` role + TEMP table and SEEDS
--     tenant/order rows — run it ONLY against a lab clone (supabase local, lab
--     project) or the local replay sandbox. NEVER run PART B against production.
--     To run PART A alone against prod, execute this file and stop at the banner.
--
-- USAGE:
--   psql -f scripts/verify-rls-lockdown.sql            (full, lab)
--   SQL Editor (Supabase lab project): paste file, run.
--
-- EXIT CONTRACT: any violated gate raises an exception (nonzero status in psql).

\set ON_ERROR_STOP on

-----------------------------------------------------------------------------
-- PART A — STATIC GATES (prod-safe, read-only; run first)
-----------------------------------------------------------------------------

CREATE TEMP TABLE IF NOT EXISTS gates (check_name text PRIMARY KEY, passed boolean NOT NULL);
TRUNCATE gates;
-- NOTE: gate rows land via `INSERT ... ON CONFLICT (check_name) DO UPDATE`,
-- which requires UPDATE privilege — grant SELECT/INSERT/UPDATE to the session
-- roles B1/B3/B4/B5 switch into (anon, authenticated).
GRANT SELECT, INSERT, UPDATE ON gates TO anon, authenticated;

-- A1 · zero bare-`true` policy quals/with-checks (pure USING(true) family)
INSERT INTO gates
SELECT 'A1_no_bare_true_quals', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual IN ('true', '(true)') OR with_check IN ('true', '(true)'))
);

-- A2 · zero latch / auth.uid() quals anywhere
INSERT INTO gates
SELECT 'A2_no_latch_or_authuid_quals', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public'
    AND (COALESCE(qual, '') LIKE '%get_current_tenant_id%'
      OR COALESCE(qual, '') LIKE '%is_tenant_admin%'
      OR COALESCE(qual, '') LIKE '%auth.uid%'
      OR COALESCE(with_check, '') LIKE '%get_current_tenant_id%'
      OR COALESCE(with_check, '') LIKE '%is_tenant_admin%'
      OR COALESCE(with_check, '') LIKE '%auth.uid%')
);

-- A3 · named policy inventory absent
INSERT INTO gates
SELECT 'A3_named_policy_inventory_absent', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public' AND policyname IN (
    'orders_select_all','orders_insert_all','orders_update_all','orders_delete_all',
    'order_items_all','order_items_tenant_access',
    'orders_tenant_based_select','orders_tenant_based_insert',
    'orders_tenant_based_update','orders_tenant_based_delete',
    'tables_select_all','tables_insert_all','tables_update_all','tables_delete_all',
    'tables_select_authenticated','tables_insert_authenticated',
    'tables_update_authenticated','tables_delete_authenticated',
    'customer_order_history_tenant_access',
    'table_statuses_select_all','table_statuses_insert_all',
    'table_statuses_update_all','table_statuses_delete_all',
    'role_permissions_all',
    'tenants_select','tenants_insert','tenants_update',
    'admin_users_select','admin_users_insert','admin_users_update',
    'admin_sessions_all',
    'Allow tenant admins to manage loyalty programs',
    'Allow tenant admins to view customer loyalty',
    'Allow tenant admins to manage coupons',
    'Allow tenant admins to manage customer coupons',
    'Allow tenant admins to view loyalty transactions',
    'Allow tenant admins to manage campaigns',
    'Allow tenant admins to view campaign recipients'
  )
);

-- A4 · dynamic latch family (`<table>_tenant_{select,insert,update,delete}`) absent
INSERT INTO gates
SELECT 'A4_dynamic_tenant_family_absent', NOT EXISTS (
  SELECT 1 FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname ~ '^[a-z_]+_tenant_(select|insert|update|delete)$'
);

-- A5 · DROP function targets absent from pg_proc
INSERT INTO gates
SELECT 'A5_dropped_functions_absent', NOT EXISTS (
  SELECT 1 FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'get_current_tenant_id','is_tenant_admin','set_tenant_context',
      'clear_tenant_context','create_tenant_policies',
      'generate_password_reset_token',
      'is_qr_code_expired','regenerate_table_qr_code',
      'update_table_status','get_next_table_status',
      'add_loyalty_points_on_order'
    )
);

-- A6 · claim helpers present
INSERT INTO gates
SELECT 'A6_claim_helpers_present',
  EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='app_claim_tenant_id')
  AND EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='app_is_super_admin');

-- A7 · claim policies present (FOR ALL TO authenticated, qual references app_claim_tenant_id)
INSERT INTO gates
SELECT 'A7_claim_policies_present', NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[
    'orders','order_items','table_sessions','customers','customer_order_history',
    'table_statuses','tenant_settings','business_hours','stock_inventory',
    'stock_movements','stock_alerts','suppliers','pre_bills','surveys',
    'tenant_subscriptions'
  ]) AS claim_table
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = claim_table
      AND cmd = 'ALL' AND roles = ARRAY['authenticated']::name[]
      AND COALESCE(qual, '') LIKE '%app_claim_tenant_id%'
  )
);

-- A8 · grants matrix (design D13)
--   anon DENIED on every claim + server-only table
INSERT INTO gates
SELECT 'A8_anon_denied_claim_and_server_tables', NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[
    'orders','order_items','table_sessions','customers','customer_order_history',
    'table_statuses','tenant_settings','business_hours','stock_inventory',
    'stock_movements','stock_alerts','suppliers','pre_bills','surveys',
    'tenant_subscriptions',
    'admin_users','admin_sessions','admin_audit_logs','password_reset_tokens',
    'role_permissions','profiles',
    'loyalty_programs','customer_loyalty','coupons','customer_coupons',
    'loyalty_transactions','marketing_campaigns','campaign_recipients'
  ]) AS t
  WHERE has_table_privilege('anon', t, 'SELECT')
     OR has_table_privilege('anon', t, 'INSERT')
     OR has_table_privilege('anon', t, 'UPDATE')
     OR has_table_privilege('anon', t, 'DELETE')
);

--   anon menu reads OK (tenants/products/categories/tables + reservations)
INSERT INTO gates
SELECT 'A8_anon_menu_grants', (
     has_table_privilege('anon', 'tenants', 'SELECT')
  AND has_table_privilege('anon', 'products', 'SELECT')
  AND has_table_privilege('anon', 'categories', 'SELECT')
  AND has_table_privilege('anon', 'tables', 'SELECT')
  AND has_table_privilege('anon', 'reservations', 'SELECT')
  AND has_table_privilege('anon', 'reservations', 'INSERT')
  AND has_table_privilege('anon', 'reservations', 'UPDATE')
);

--   authenticated grant set for claim tables (staff flows)
INSERT INTO gates
SELECT 'A8_authenticated_claim_grants', NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[
    'orders','order_items','table_sessions','customers','customer_order_history',
    'table_statuses','tenant_settings','business_hours','stock_inventory',
    'stock_movements','stock_alerts','suppliers','pre_bills','surveys',
    'tenant_subscriptions'
  ]) AS t
  WHERE NOT has_table_privilege('authenticated', t, 'SELECT')
     OR NOT has_table_privilege('authenticated', t, 'INSERT')
     OR NOT has_table_privilege('authenticated', t, 'UPDATE')
     OR NOT has_table_privilege('authenticated', t, 'DELETE')
);

-- A9 · SECURITY DEFINER analytics family: PUBLIC EXECUTE revoked, get_top_products claims-granted
INSERT INTO gates
SELECT 'A9_analytics_public_execute_revoked', NOT EXISTS (
  SELECT 1 FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'get_top_products','get_daily_sales_metrics','get_low_stock_alerts',
      'get_customer_metrics','get_sales_report','cleanup_expired_sessions',
      'is_business_open','user_has_permission'
    )
    AND has_function_privilege('public', oid, 'EXECUTE')
);
INSERT INTO gates
SELECT 'A9_get_top_products_authenticated_granted', NOT EXISTS (
  SELECT 1 FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace AND proname = 'get_top_products'
    AND NOT has_function_privilege('authenticated', oid, 'EXECUTE')
);

-- A10 · RLS enabled on server-only + claim tables
INSERT INTO gates
SELECT 'A10_rls_enabled_on_locked_tables', NOT EXISTS (
  SELECT 1 FROM unnest(ARRAY[
    'password_reset_tokens','role_permissions',
    'loyalty_programs','customer_loyalty','coupons','customer_coupons',
    'loyalty_transactions','marketing_campaigns','campaign_recipients',
    'table_statuses','orders','order_items','table_sessions','customers',
    'customer_order_history','tenant_settings','business_hours','stock_inventory',
    'stock_movements','stock_alerts','suppliers'
  ]) AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = t AND c.relrowsecurity
  )
);

-- A11 · live trigger targets kept; loyalty trigger absent
INSERT INTO gates
SELECT 'A11_triggers_kept_and_loyalty_dropped',
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trigger_update_stock_after_order' AND NOT tgisinternal)
  AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trigger_update_customer_stats' AND NOT tgisinternal)
  AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trigger_clear_insecure_password' AND NOT tgisinternal)
  AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trigger_add_loyalty_points' AND NOT tgisinternal);

-----------------------------------------------------------------------------
-- PART B — FUNCTIONAL GATES (LAB ONLY: creates roles, seeds rows)
-- STOP — do not run PART B against production.
-----------------------------------------------------------------------------

-- gate_user: non-superuser session role able to assume anon/authenticated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gate_user') THEN
    CREATE ROLE gate_user NOLOGIN;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'anon' AND u.rolname = 'gate_user'
  ) THEN GRANT anon TO gate_user; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE r.rolname = 'authenticated' AND u.rolname = 'gate_user'
  ) THEN GRANT authenticated TO gate_user; END IF;
END $$;

-- B1 · anon matrix: claim tables yield 0 rows or access error; menu tables readable
-- IMPORTANT: runs as anon (SET ROLE) so RLS + grants are ACTUALLY enforced —
-- running as superuser would bypass RLS and return full row counts.
SET ROLE anon;
DO $$
DECLARE
  c int; err text := '';
BEGIN
  FOREACH err IN ARRAY ARRAY[
    'orders','order_items','table_sessions','customers','customer_order_history',
    'table_statuses','admin_users','admin_sessions','password_reset_tokens',
    'role_permissions','profiles','tenant_settings',
    'loyalty_programs','customer_loyalty','coupons','customer_coupons',
    'loyalty_transactions','marketing_campaigns','campaign_recipients'
  ] LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', err) INTO c;
      INSERT INTO gates VALUES (err || '_anon_zero', c = 0) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
    EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
      INSERT INTO gates VALUES (err || '_anon_zero', true) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
    END;
  END LOOP;
  -- menu tables must be readable (0 rows is fine — unseeded)
  FOREACH err IN ARRAY ARRAY['tenants','products','categories','tables','reservations'] LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', err) INTO c;
      INSERT INTO gates VALUES (err || '_anon_menu_readable', true) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
    EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
      INSERT INTO gates VALUES (err || '_anon_menu_readable', false) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
    END;
  END LOOP;
END $$;
RESET ROLE;

-- Seed (superuser, RLS-bypassing): tenant A + B, products, session, orders, stock.
-- Guarded so re-runs converge instead of duplicating.
INSERT INTO tenants (name, subdomain, slug, is_active)
SELECT 'Tenant A', 'a-smoke', 'a-smoke', true
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE subdomain = 'a-smoke');
INSERT INTO tenants (name, subdomain, slug, is_active)
SELECT 'Tenant B', 'b-smoke', 'b-smoke', true
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE subdomain = 'b-smoke');

INSERT INTO categories (tenant_id, name, slug, is_active)
SELECT id, 'Cat A', 'cat-a', true FROM tenants WHERE subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM categories c JOIN tenants t ON c.tenant_id=t.id WHERE t.subdomain='a-smoke');

INSERT INTO products (tenant_id, category_id, name, slug, price, is_available)
SELECT t.id, cat.id, 'Prod A1', 'prod-a1', 1000, true
FROM tenants t JOIN categories cat ON cat.tenant_id = t.id
WHERE t.subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.slug='prod-a1');
INSERT INTO products (tenant_id, name, slug, price, is_available)
SELECT id, 'Prod B1', 'prod-b1', 900, true FROM tenants WHERE subdomain='b-smoke'
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.slug='prod-b1');

INSERT INTO tables (tenant_id, number, capacity, unique_code, is_active)
SELECT id, '1', 4, 'AA1', true FROM tenants WHERE subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM tables WHERE unique_code='AA1');

INSERT INTO table_sessions (tenant_id, table_id, session_code, status)
SELECT t.id, tb.id, 'AA1-SMOKE', 'active'
FROM tenants t JOIN tables tb ON tb.tenant_id = t.id
WHERE t.subdomain='a-smoke' AND NOT EXISTS (SELECT 1 FROM table_sessions WHERE session_code='AA1-SMOKE');

INSERT INTO orders (tenant_id, order_number, status, subtotal, tax, total)
SELECT id, 'A-1001', 'pending', 1000, 190, 1190 FROM tenants WHERE subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number='A-1001');
INSERT INTO orders (tenant_id, order_number, status, subtotal, tax, total)
SELECT id, 'A-1002', 'pending', 1000, 190, 1190 FROM tenants WHERE subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number='A-1002');
INSERT INTO orders (tenant_id, order_number, status, subtotal, tax, total)
SELECT id, 'B-2001', 'pending', 900, 171, 1071 FROM tenants WHERE subdomain='b-smoke'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number='B-2001');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT o.id, p.id, 1, p.price, p.price
FROM orders o JOIN products p ON p.slug = 'prod-a1'
WHERE o.order_number = 'A-1001'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT o.id, p.id, 1, p.price, p.price
FROM orders o JOIN products p ON p.slug = 'prod-a1'
WHERE o.order_number = 'A-1002'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
SELECT o.id, p.id, 1, p.price, p.price
FROM orders o JOIN products p ON p.slug = 'prod-b1'
WHERE o.order_number = 'B-2001'
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);

-- stock seeded AFTER orders so the stock trigger no-ops during seeding
INSERT INTO stock_inventory (tenant_id, product_id, current_stock, min_stock)
SELECT t.id, p.id, 10, 2
FROM tenants t JOIN products p ON p.slug='prod-a1'
WHERE t.subdomain='a-smoke'
  AND NOT EXISTS (SELECT 1 FROM stock_inventory si WHERE si.product_id = p.id);

-- B3 · staff (tenant A) claims: own-tenant rows only (2 orders, 1 product, 1 session, 1 stock row)
-- Claim JSON is built from the seeded tenant id BEFORE switching role (superuser lookup,
-- no RLS interference) — replaces the old literal `<TENANT_A>` placeholder.
SELECT set_config('request.jwt.claims',
  jsonb_build_object(
    'app_tenant_id', (SELECT t.id::text FROM tenants t WHERE t.subdomain = 'a-smoke'),
    'app_role', 'staff',
    'app_user_id', '00000000-0000-4000-8000-00000000000a'
  )::text, false);
SET ROLE authenticated;

DO $$
DECLARE c int;
BEGIN
  EXECUTE 'SELECT count(*) FROM orders' INTO c;
  INSERT INTO gates VALUES ('B3_staff_orders_own_only', c = 2) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  EXECUTE 'SELECT count(*) FROM products' INTO c;
  INSERT INTO gates VALUES ('B3_staff_products_own_only', c = 1) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  EXECUTE 'SELECT count(*) FROM table_sessions' INTO c;
  INSERT INTO gates VALUES ('B3_staff_sessions_own_only', c = 1) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  EXECUTE 'SELECT count(*) FROM stock_inventory' INTO c;
  INSERT INTO gates VALUES ('B3_staff_stock_own_only', c = 1) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  EXECUTE 'SELECT count(*) FROM order_items' INTO c;
  INSERT INTO gates VALUES ('B3_staff_order_items_own_only', c = 2) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
END $$;

-- B4 · super_admin claims: cross-tenant visibility (3 orders, 2 products)
SELECT set_config('request.jwt.claims', '{"app_tenant_id": null, "app_role": "super_admin", "app_user_id": "00000000-0000-4000-8000-0000000000aa"}', false);
DO $$
DECLARE c int;
BEGIN
  EXECUTE 'SELECT count(*) FROM orders' INTO c;
  INSERT INTO gates VALUES ('B4_super_orders_all', c = 3) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  EXECUTE 'SELECT count(*) FROM products' INTO c;
  INSERT INTO gates VALUES ('B4_super_products_all', c = 2) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
END $$;

-- B5 · staff write + trigger smoke (claim A): order + order_items insert fires
--     update_stock_after_order → stock_movements row + stock 10-2=8
-- The old plain-SQL `INSERT ... RETURNING id INTO smoke_order` was invalid;
-- rewritten as a self-contained PL/pgSQL block (also RLS-enforced as authenticated).
RESET ROLE;  -- resolve the tenant id as superuser (no RLS interference)
SELECT set_config('request.jwt.claims',
  jsonb_build_object(
    'app_tenant_id', (SELECT t.id::text FROM tenants t WHERE t.subdomain = 'a-smoke'),
    'app_role', 'staff',
    'app_user_id', '00000000-0000-4000-8000-00000000000a'
  )::text, false);
SET ROLE authenticated;

DO $$
DECLARE
  v_order uuid;
  v_stock numeric;
  v_mov   int;
  v_has_item boolean;
BEGIN
  SELECT id INTO v_order FROM orders WHERE order_number = 'SMOKE-001';
  IF v_order IS NULL THEN
    INSERT INTO orders (tenant_id, order_number, status, subtotal, tax, total)
    SELECT t.id, 'SMOKE-001', 'pending', 2000, 380, 2380
    FROM tenants t WHERE t.subdomain = 'a-smoke'
    RETURNING id INTO v_order;
  END IF;

  SELECT EXISTS (SELECT 1 FROM order_items WHERE order_id = v_order) INTO v_has_item;
  IF NOT v_has_item THEN
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    SELECT v_order, p.id, 2, p.price, p.price FROM products p WHERE p.slug = 'prod-a1';
  END IF;

  SELECT si.current_stock INTO v_stock
  FROM stock_inventory si JOIN products p ON si.product_id = p.id
  WHERE p.slug = 'prod-a1';
  SELECT count(*) INTO v_mov
  FROM stock_movements sm JOIN products p ON sm.product_id = p.id
  WHERE p.slug = 'prod-a1';

  -- COALESCE: missing rows (e.g. after rollback) yield NULL comparisons, which
  -- would violate the NOT NULL constraint before the final gate evaluation —
  -- treat "no data found" as a failed gate instead.
  INSERT INTO gates VALUES ('B5_stock_decremented', COALESCE(v_stock = 8, false)) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
  INSERT INTO gates VALUES ('B5_stock_movement_recorded', COALESCE(v_mov = 1, false)) ON CONFLICT (check_name) DO UPDATE SET passed = EXCLUDED.passed;
END $$;

RESET ROLE;

-- final gate evaluation
DO $$
DECLARE
  bad text;
  cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM gates WHERE NOT passed;
  IF cnt > 0 THEN
    SELECT string_agg(check_name, ', ' ORDER BY check_name) INTO bad FROM gates WHERE NOT passed;
    RAISE EXCEPTION 'VERIFY FAILED — % violated gate(s): %', cnt, bad;
  END IF;
  RAISE NOTICE 'ALL VERIFY GATES PASSED (%)', (SELECT count(*) FROM gates);
END $$;