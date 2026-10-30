-- scripts/verify-analytics.sql
--
-- Gates for database/analytics-functions.sql (get_analytics + indexes).
--
-- TDD ROLE:
--   * RED: before analytics-functions.sql is applied, must FAIL.
--   * GREEN: after it is applied, must end with ALL ANALYTICS GATES PASSED.
--   * ROLLBACK proof: after rollback-analytics-functions.sql, must FAIL again.
--
-- WHERE TO RUN:
--   * PART A (static gates) is READ-ONLY and prod-safe (pg_catalog reads).
--   * PART B (functional gates) SEEDS tenants/orders inside a transaction that
--     is rolled back. It runs ONLY when psql gets `-v lab=1`. Never pass that
--     flag against production.
--
-- USAGE:
--   psql -f scripts/verify-analytics.sql              (PART A only, prod-safe)
--   psql -v lab=1 -f scripts/verify-analytics.sql     (PART A + PART B, lab)
--
-- EXIT CONTRACT: any violated gate raises an exception (nonzero status in psql).

\set ON_ERROR_STOP on

-----------------------------------------------------------------------------
-- PART A — STATIC GATES (prod-safe, read-only)
-----------------------------------------------------------------------------

DO $$
DECLARE
  v_fn oid := to_regprocedure('public.get_analytics(uuid, timestamptz, timestamptz)');
  v_failed text[] := '{}';
BEGIN
  IF v_fn IS NULL THEN
    RAISE EXCEPTION 'A1_function_exists FAILED: public.get_analytics(uuid, timestamptz, timestamptz) is missing';
  END IF;

  -- A2 · SECURITY INVOKER, so RLS keeps scoping rows
  IF (SELECT prosecdef FROM pg_proc WHERE oid = v_fn) THEN
    v_failed := v_failed || 'A2_security_invoker';
  END IF;

  -- A3 · authenticated may execute; anon and PUBLIC may not
  IF NOT has_function_privilege('authenticated', v_fn, 'EXECUTE') THEN
    v_failed := v_failed || 'A3_authenticated_execute';
  END IF;
  IF has_function_privilege('anon', v_fn, 'EXECUTE') THEN
    v_failed := v_failed || 'A3_anon_no_execute';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    WHERE p.oid = v_fn AND a.grantee = 0 AND a.privilege_type = 'EXECUTE'
  ) THEN
    v_failed := v_failed || 'A3_public_no_execute';
  END IF;

  -- A4 · range-filter indexes
  IF to_regclass('public.idx_orders_tenant_created_at') IS NULL THEN
    v_failed := v_failed || 'A4_orders_tenant_created_at_index';
  END IF;
  IF to_regclass('public.idx_order_items_order_id') IS NULL THEN
    v_failed := v_failed || 'A4_order_items_order_id_index';
  END IF;

  IF cardinality(v_failed) > 0 THEN
    RAISE EXCEPTION 'PART A FAILED: %', array_to_string(v_failed, ', ');
  END IF;
  RAISE NOTICE 'PART A PASSED';
END $$;

\if :{?lab}
\else
\echo 'PART A only (pass -v lab=1 against a lab database to run PART B).'
\quit
\endif

-----------------------------------------------------------------------------
-- PART B — FUNCTIONAL GATES (lab only; everything is rolled back)
-----------------------------------------------------------------------------
-- Period under test: [2001-01-01, 2001-01-03) America/Santiago (UTC-3).
-- Previous period:   [2000-12-30, 2001-01-01).
-- Dates sit in 2001 so a lab cloned from production holds no other orders in
-- these windows; in-progress counts are only asserted per tenant for the same reason.

BEGIN;

INSERT INTO tenants (id, name, slug) VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Gate Cafe A', 'gate-cafe-a'),
  ('b0000000-0000-4000-8000-000000000001', 'Gate Cafe B', 'gate-cafe-b');

INSERT INTO categories (id, tenant_id, name, slug) VALUES
  ('a0000000-0000-4000-8000-0000000000c1', 'a0000000-0000-4000-8000-000000000001', 'Gate Coffee', 'gate-coffee'),
  ('a0000000-0000-4000-8000-0000000000c2', 'a0000000-0000-4000-8000-000000000001', 'Gate Cake', 'gate-cake'),
  ('b0000000-0000-4000-8000-0000000000c1', 'b0000000-0000-4000-8000-000000000001', 'Gate Tea', 'gate-tea');

INSERT INTO products (id, tenant_id, category_id, name, slug, price) VALUES
  ('a0000000-0000-4000-8000-0000000000f1', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000c1', 'Gate Latte', 'gate-latte', 300),
  ('a0000000-0000-4000-8000-0000000000f2', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000c2', 'Gate Brownie', 'gate-brownie', 400),
  ('b0000000-0000-4000-8000-0000000000f1', 'b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-0000000000c1', 'Gate Chai', 'gate-chai', 5000);

INSERT INTO orders (id, tenant_id, status, subtotal, total, table_number, created_at) VALUES
  -- tenant A, current period
  ('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-000000000001', 'delivered', 1000, 1000, '5',  '2001-01-01 10:15-03'),
  ('a0000000-0000-4000-8000-0000000000a2', 'a0000000-0000-4000-8000-000000000001', 'delivered', 2000, 2000, NULL, '2001-01-01 23:30-03'),
  ('a0000000-0000-4000-8000-0000000000a3', 'a0000000-0000-4000-8000-000000000001', 'cancelled', 500,  500,  '5',  '2001-01-02 12:00-03'),
  ('a0000000-0000-4000-8000-0000000000a4', 'a0000000-0000-4000-8000-000000000001', 'pending',   700,  700,  '2',  '2001-01-02 13:00-03'),
  -- tenant A, previous period
  ('a0000000-0000-4000-8000-0000000000a5', 'a0000000-0000-4000-8000-000000000001', 'delivered', 300,  300,  '1',  '2000-12-31 09:00-03'),
  -- tenant A, exactly at p_to (excluded: half-open range)
  ('a0000000-0000-4000-8000-0000000000a6', 'a0000000-0000-4000-8000-000000000001', 'delivered', 999,  999,  '1',  '2001-01-03 00:00-03'),
  -- tenant B
  ('b0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000001', 'delivered', 5000, 5000, '1',  '2001-01-02 15:00-03'),
  ('b0000000-0000-4000-8000-0000000000b2', 'b0000000-0000-4000-8000-000000000001', 'preparing', 100,  100,  '1',  '2001-01-02 16:00-03');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
  ('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000f1', 2, 300, 600),
  ('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000f2', 1, 400, 400),
  ('a0000000-0000-4000-8000-0000000000a2', 'a0000000-0000-4000-8000-0000000000f1', 4, 300, 1200),
  ('a0000000-0000-4000-8000-0000000000a2', 'a0000000-0000-4000-8000-0000000000f2', 2, 400, 800),
  ('a0000000-0000-4000-8000-0000000000a3', 'a0000000-0000-4000-8000-0000000000f1', 1, 500, 500),
  ('b0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-0000000000f1', 1, 5000, 5000);

-- Results land here so the authenticated role can write them.
CREATE TEMP TABLE analytics_results (gate text PRIMARY KEY, result jsonb, error text);
GRANT SELECT, INSERT ON analytics_results TO authenticated;

SET LOCAL ROLE authenticated;

-- B1 · tenant admin of A, own tenant
SELECT set_config('request.jwt.claims',
  '{"app_tenant_id": "a0000000-0000-4000-8000-000000000001", "app_role": "tenant_admin"}', true);
INSERT INTO analytics_results (gate, result)
SELECT 'tenant_a', public.get_analytics('a0000000-0000-4000-8000-000000000001', '2001-01-01 00:00-03', '2001-01-03 00:00-03');

-- B2 · forbidden calls, each captured by its error message
DO $$
DECLARE
  v_case record;
BEGIN
  FOR v_case IN
    SELECT * FROM (VALUES
      ('tenant_a_asks_b',   '{"app_tenant_id": "a0000000-0000-4000-8000-000000000001", "app_role": "tenant_admin"}', 'b0000000-0000-4000-8000-000000000001'::uuid, '2001-01-03 00:00-03'::timestamptz),
      ('tenant_a_asks_all', '{"app_tenant_id": "a0000000-0000-4000-8000-000000000001", "app_role": "tenant_admin"}', NULL, '2001-01-03 00:00-03'),
      ('staff_own_tenant',  '{"app_tenant_id": "a0000000-0000-4000-8000-000000000001", "app_role": "staff"}',        'a0000000-0000-4000-8000-000000000001', '2001-01-03 00:00-03'),
      ('no_claims',         '',                                                                                     'a0000000-0000-4000-8000-000000000001', '2001-01-03 00:00-03'),
      ('empty_range',       '{"app_tenant_id": "a0000000-0000-4000-8000-000000000001", "app_role": "tenant_admin"}', 'a0000000-0000-4000-8000-000000000001', '2001-01-01 00:00-03')
    ) AS t(gate, claims, tenant_id, p_to)
  LOOP
    PERFORM set_config('request.jwt.claims', v_case.claims, true);
    BEGIN
      INSERT INTO analytics_results (gate, result)
      SELECT v_case.gate, public.get_analytics(v_case.tenant_id, '2001-01-01 00:00-03', v_case.p_to);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO analytics_results (gate, error) VALUES (v_case.gate, SQLERRM);
    END;
  END LOOP;
END $$;

-- B3 · super admin, all locals and a single local
SELECT set_config('request.jwt.claims', '{"app_tenant_id": null, "app_role": "super_admin"}', true);
INSERT INTO analytics_results (gate, result)
SELECT 'super_all', public.get_analytics(NULL, '2001-01-01 00:00-03', '2001-01-03 00:00-03');
INSERT INTO analytics_results (gate, result)
SELECT 'super_b', public.get_analytics('b0000000-0000-4000-8000-000000000001', '2001-01-01 00:00-03', '2001-01-03 00:00-03');

RESET ROLE;

DO $$
DECLARE
  a jsonb := (SELECT result FROM analytics_results WHERE gate = 'tenant_a');
  s jsonb := (SELECT result FROM analytics_results WHERE gate = 'super_all');
  sb jsonb := (SELECT result FROM analytics_results WHERE gate = 'super_b');
  v_failed text[] := '{}';
  v_case record;
BEGIN
  -- B1 · summary (delivered only, cancellation over all orders, previous period)
  IF a IS NULL THEN
    RAISE EXCEPTION 'B1 FAILED: tenant_a call returned no result (error: %)',
      (SELECT error FROM analytics_results WHERE gate = 'tenant_a');
  END IF;
  IF a #> '{summary,current}' <> '{"sales": 3000, "orders": 2, "average_ticket": 1500, "cancelled": 1, "total_orders": 4, "cancellation_rate": 0.25}'::jsonb THEN
    v_failed := v_failed || format('B1_summary_current %s', a #> '{summary,current}');
  END IF;
  IF a #> '{summary,previous}' <> '{"sales": 300, "orders": 1, "average_ticket": 300, "cancelled": 0, "total_orders": 1, "cancellation_rate": 0}'::jsonb THEN
    v_failed := v_failed || format('B1_summary_previous %s', a #> '{summary,previous}');
  END IF;

  -- B1 · daily series in America/Santiago, zero days included
  IF a -> 'daily' <> '[{"date": "2001-01-01", "sales": 3000, "orders": 2}, {"date": "2001-01-02", "sales": 0, "orders": 0}]'::jsonb THEN
    v_failed := v_failed || format('B1_daily %s', a -> 'daily');
  END IF;

  -- B1 · hourly flow: 24 buckets, local hours 10 and 23
  IF jsonb_array_length(a -> 'hourly') <> 24
     OR a #> '{hourly,10}' <> '{"hour": 10, "sales": 1000, "orders": 1}'::jsonb
     OR a #> '{hourly,23}' <> '{"hour": 23, "sales": 2000, "orders": 1}'::jsonb
     OR (SELECT sum((h ->> 'orders')::int) FROM jsonb_array_elements(a -> 'hourly') h) <> 2 THEN
    v_failed := v_failed || format('B1_hourly %s', a -> 'hourly');
  END IF;

  -- B1 · in progress (independent of the period)
  IF a -> 'in_progress' <> '{"pending": 1, "preparing": 0, "ready": 0}'::jsonb THEN
    v_failed := v_failed || format('B1_in_progress %s', a -> 'in_progress');
  END IF;

  -- B1 · top products, categories, tables (delivered only)
  IF a -> 'top_products' <> '[
      {"product_id": "a0000000-0000-4000-8000-0000000000f1", "name": "Gate Latte", "category": "Gate Coffee", "units": 6, "revenue": 1800},
      {"product_id": "a0000000-0000-4000-8000-0000000000f2", "name": "Gate Brownie", "category": "Gate Cake", "units": 3, "revenue": 1200}
    ]'::jsonb THEN
    v_failed := v_failed || format('B1_top_products %s', a -> 'top_products');
  END IF;
  IF a -> 'categories' <> '[
      {"category_id": "a0000000-0000-4000-8000-0000000000c1", "name": "Gate Coffee", "units": 6, "revenue": 1800},
      {"category_id": "a0000000-0000-4000-8000-0000000000c2", "name": "Gate Cake", "units": 3, "revenue": 1200}
    ]'::jsonb THEN
    v_failed := v_failed || format('B1_categories %s', a -> 'categories');
  END IF;
  IF a -> 'tables' <> '[{"table_number": null, "sales": 2000, "orders": 1}, {"table_number": "5", "sales": 1000, "orders": 1}]'::jsonb THEN
    v_failed := v_failed || format('B1_tables %s', a -> 'tables');
  END IF;

  -- B1 · no locals ranking for a single tenant
  IF a -> 'locals' <> 'null'::jsonb THEN
    v_failed := v_failed || format('B1_locals_null %s', a -> 'locals');
  END IF;

  -- B2 · forbidden / invalid calls
  FOR v_case IN
    SELECT * FROM (VALUES
      ('tenant_a_asks_b', 'forbidden'), ('tenant_a_asks_all', 'forbidden'),
      ('staff_own_tenant', 'forbidden'), ('no_claims', 'forbidden'),
      ('empty_range', 'invalid_range')
    ) AS t(gate, expected)
  LOOP
    IF (SELECT error FROM analytics_results WHERE gate = v_case.gate) IS DISTINCT FROM v_case.expected THEN
      v_failed := v_failed || format('B2_%s got %s', v_case.gate,
        coalesce((SELECT coalesce(error, 'a result') FROM analytics_results WHERE gate = v_case.gate), 'nothing'));
    END IF;
  END LOOP;

  -- B3 · super admin: consolidated summary and locals ranking (sales desc)
  IF s #> '{summary,current,sales}' <> '8000'::jsonb OR s #> '{summary,current,orders}' <> '3'::jsonb THEN
    v_failed := v_failed || format('B3_super_summary %s', s #> '{summary,current}');
  END IF;
  IF sb -> 'in_progress' <> '{"pending": 0, "preparing": 1, "ready": 0}'::jsonb THEN
    v_failed := v_failed || format('B3_super_in_progress %s', sb -> 'in_progress');
  END IF;
  IF (SELECT jsonb_agg(l.value - 'is_active' ORDER BY l.ordinality)
      FROM jsonb_array_elements(s -> 'locals') WITH ORDINALITY l
      WHERE l.value ->> 'tenant_id' IN ('a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001'))
     <> '[
      {"tenant_id": "b0000000-0000-4000-8000-000000000001", "name": "Gate Cafe B", "sales": 5000, "orders": 1, "average_ticket": 5000, "cancellation_rate": 0},
      {"tenant_id": "a0000000-0000-4000-8000-000000000001", "name": "Gate Cafe A", "sales": 3000, "orders": 2, "average_ticket": 1500, "cancellation_rate": 0.25}
    ]'::jsonb THEN
    v_failed := v_failed || format('B3_super_locals %s', s -> 'locals');
  END IF;
  IF sb #> '{summary,current,sales}' <> '5000'::jsonb OR sb -> 'locals' <> 'null'::jsonb THEN
    v_failed := v_failed || format('B3_super_single_tenant %s', sb -> 'summary');
  END IF;

  IF cardinality(v_failed) > 0 THEN
    RAISE EXCEPTION 'PART B FAILED: %', array_to_string(v_failed, E'\n  ');
  END IF;
  RAISE NOTICE 'ALL ANALYTICS GATES PASSED';
END $$;

ROLLBACK;
