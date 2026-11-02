-- scripts/verify-waiter-calls.sql
--
-- Gates for database/create-waiter-calls.sql (call-waiter, odd/tasks/call-waiter.md).
--
-- TDD ROLE:
--   * GREEN: after create-waiter-calls.sql is applied, must end with
--     ALL WAITER CALL GATES PASSED.
--   * ROLLBACK proof: after rollback-create-waiter-calls.sql, PART A must FAIL.
--
-- WHERE TO RUN:
--   * PART A (static gates) is READ-ONLY and prod-safe (pg_catalog reads).
--   * PART B (functional gates) SEEDS tenants/tables/sessions inside a
--     transaction that is rolled back. It runs ONLY when psql gets `-v lab=1`.
--     Never pass that flag against production.
--   * Concurrency (one pending call under 8+ parallel requests) cannot run in
--     one transaction; it was proven with parallel psql sessions (see the
--     feature document log).
--
-- USAGE:
--   psql -f scripts/verify-waiter-calls.sql              (PART A only, prod-safe)
--   psql -v lab=1 -f scripts/verify-waiter-calls.sql     (PART A + PART B, lab)
--
-- EXIT CONTRACT: any violated gate raises an exception (nonzero status in psql).

\set ON_ERROR_STOP on

-----------------------------------------------------------------------------
-- PART A — STATIC GATES (prod-safe, read-only)
-----------------------------------------------------------------------------

DO $$
DECLARE
  v_fn oid := to_regprocedure('public.tappmesa_request_waiter_call(uuid, text)');
  v_failed text[] := '{}';
BEGIN
  IF to_regclass('public.waiter_calls') IS NULL THEN
    RAISE EXCEPTION 'A1_table_exists FAILED: public.waiter_calls is missing';
  END IF;
  IF v_fn IS NULL THEN
    RAISE EXCEPTION 'A2_function_exists FAILED: tappmesa_request_waiter_call(uuid, text) is missing';
  END IF;

  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.waiter_calls'::regclass) THEN
    v_failed := v_failed || 'A3_rls_enabled';
  END IF;
  IF has_table_privilege('anon', 'public.waiter_calls', 'SELECT')
     OR has_table_privilege('anon', 'public.waiter_calls', 'INSERT')
     OR has_table_privilege('anon', 'public.waiter_calls', 'UPDATE') THEN
    v_failed := v_failed || 'A4_no_anon_table_access';
  END IF;
  IF has_function_privilege('anon', v_fn, 'EXECUTE')
     OR has_function_privilege('authenticated', v_fn, 'EXECUTE') THEN
    v_failed := v_failed || 'A5_function_service_role_only';
  END IF;
  IF has_table_privilege('authenticated', 'public.waiter_calls', 'INSERT')
     OR has_table_privilege('authenticated', 'public.waiter_calls', 'DELETE')
     OR has_column_privilege('authenticated', 'public.waiter_calls', 'reason', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.waiter_calls', 'resolved_by', 'UPDATE')
     OR NOT has_column_privilege('authenticated', 'public.waiter_calls', 'status', 'UPDATE') THEN
    v_failed := v_failed || 'A6_staff_updates_status_only';
  END IF;
  IF to_regclass('public.waiter_calls_one_pending_per_session') IS NULL THEN
    v_failed := v_failed || 'A7_one_pending_index';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'waiter_calls_enabled'
  ) THEN
    v_failed := v_failed || 'A8_tenant_toggle';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'waiter_calls'
  ) THEN
    v_failed := v_failed || 'A9_realtime_publication';
  END IF;

  IF cardinality(v_failed) > 0 THEN
    RAISE EXCEPTION 'PART A FAILED: %', array_to_string(v_failed, ', ');
  END IF;
  RAISE NOTICE 'PART A PASSED';
END $$;

\if :{?lab}
SELECT :'lab' = '1' AS run_lab \gset
\else
\set run_lab false
\endif
\if :run_lab
\else
\echo 'PART A only (pass -v lab=1 against a lab database to run PART B).'
\quit
\endif

-----------------------------------------------------------------------------
-- PART B — FUNCTIONAL GATES (lab only; everything is rolled back)
-----------------------------------------------------------------------------

BEGIN;

INSERT INTO tenants (id, name, slug) VALUES
  ('a0000000-0000-4000-8000-0000000000e1', 'Gate Call A', 'gate-call-a'),
  ('b0000000-0000-4000-8000-0000000000e1', 'Gate Call B', 'gate-call-b');
INSERT INTO tables (id, tenant_id, number, capacity) VALUES
  ('a0000000-0000-4000-8000-0000000000e2', 'a0000000-0000-4000-8000-0000000000e1', 'G4', 4),
  ('b0000000-0000-4000-8000-0000000000e2', 'b0000000-0000-4000-8000-0000000000e1', 'G1', 4);
INSERT INTO table_sessions (id, tenant_id, table_id, session_code) VALUES
  ('a0000000-0000-4000-8000-0000000000e3', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000e2', 'GATE-A'),
  ('b0000000-0000-4000-8000-0000000000e3', 'b0000000-0000-4000-8000-0000000000e1', 'b0000000-0000-4000-8000-0000000000e2', 'GATE-B');

CREATE OR REPLACE FUNCTION pg_temp.expect_error(p_sql text, p_code text, p_gate text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RAISE EXCEPTION '% FAILED: expected error %', p_gate, p_code;
EXCEPTION WHEN OTHERS THEN
  IF position(p_code IN SQLERRM) = 0 THEN
    RAISE EXCEPTION '% FAILED: expected %, got %', p_gate, p_code, SQLERRM;
  END IF;
END $$;

DO $$
DECLARE
  sa constant uuid := 'a0000000-0000-4000-8000-0000000000e3';
  sb constant uuid := 'b0000000-0000-4000-8000-0000000000e3';
  v_first uuid;
  v_again uuid;
  v_count int;
BEGIN
  -- B1 · one pending call per session; a repeat returns the same call (S4)
  SELECT id INTO v_first FROM tappmesa_request_waiter_call(sa, 'bill');
  SELECT id INTO v_again FROM tappmesa_request_waiter_call(sa, 'other');
  IF v_first IS DISTINCT FROM v_again THEN RAISE EXCEPTION 'B1_one_pending FAILED'; END IF;

  -- B2 · invalid reason and closed session are rejected
  PERFORM pg_temp.expect_error(format('SELECT tappmesa_request_waiter_call(%L, %L)', sa, 'party'), 'INVALID_REASON', 'B2a');
  PERFORM pg_temp.expect_error(format('SELECT tappmesa_request_waiter_call(%L, NULL)', gen_random_uuid()), 'SESSION_NOT_ACTIVE', 'B2b');

  -- B3 · cooldown after a cancel (S5)
  UPDATE waiter_calls SET status = 'cancelled' WHERE id = v_first;
  PERFORM pg_temp.expect_error(format('SELECT tappmesa_request_waiter_call(%L)', sa), 'WAITER_CALL_COOLDOWN', 'B3');

  -- B4 · cooldown is over after 60 seconds
  UPDATE waiter_calls SET resolved_at = now() - interval '61 seconds' WHERE id = v_first;
  SELECT id INTO v_first FROM tappmesa_request_waiter_call(sa);

  -- B5 · expiry after 5 minutes, and no cooldown after an expiry (S6)
  UPDATE waiter_calls SET expires_at = now() - interval '1 second' WHERE id = v_first;
  SELECT id INTO v_again FROM tappmesa_request_waiter_call(sa);
  IF v_again = v_first OR (SELECT status FROM waiter_calls WHERE id = v_first) <> 'expired' THEN
    RAISE EXCEPTION 'B5_expiry FAILED';
  END IF;

  -- B6 · disabled tenant rejects new calls (S7)
  UPDATE tenants SET waiter_calls_enabled = false WHERE id = 'b0000000-0000-4000-8000-0000000000e1';
  PERFORM pg_temp.expect_error(format('SELECT tappmesa_request_waiter_call(%L)', sb), 'WAITER_CALLS_DISABLED', 'B6');
  UPDATE tenants SET waiter_calls_enabled = true WHERE id = 'b0000000-0000-4000-8000-0000000000e1';
  PERFORM tappmesa_request_waiter_call(sb);

  SELECT count(*) INTO v_count FROM waiter_calls WHERE table_session_id IN (sa, sb) AND status = 'pending';
  IF v_count <> 2 THEN RAISE EXCEPTION 'B7_pending_count FAILED: %', v_count; END IF;
  RAISE NOTICE 'PART B1-B7 PASSED';
END $$;

-- B8 · staff visibility and resolution under claim RLS (S8, S10)
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"role":"authenticated","app_tenant_id":"a0000000-0000-4000-8000-0000000000e1","app_role":"waiter"}', true);
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM waiter_calls WHERE tenant_id = 'b0000000-0000-4000-8000-0000000000e1';
  IF v_count <> 0 THEN RAISE EXCEPTION 'B8a_cross_tenant_read FAILED'; END IF;
  UPDATE waiter_calls SET status = 'attended' WHERE tenant_id = 'b0000000-0000-4000-8000-0000000000e1';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 0 THEN RAISE EXCEPTION 'B8b_cross_tenant_write FAILED'; END IF;
  -- the expired call of tenant A is not attendable
  UPDATE waiter_calls SET status = 'attended' WHERE status = 'pending' AND expires_at <= now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 0 THEN RAISE EXCEPTION 'B8c_expired_not_attendable FAILED'; END IF;
  UPDATE waiter_calls SET status = 'attended' WHERE status = 'pending';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> 1 THEN RAISE EXCEPTION 'B8d_attend FAILED: %', v_count; END IF;
  PERFORM pg_temp.expect_error('UPDATE waiter_calls SET reason = ''other''', 'permission denied', 'B8e_only_status');
END $$;

SELECT set_config('request.jwt.claims',
  '{"role":"authenticated","app_tenant_id":"a0000000-0000-4000-8000-0000000000e1","app_role":"kitchen"}', true);
DO $$
BEGIN
  IF (SELECT count(*) FROM waiter_calls) <> 0 THEN RAISE EXCEPTION 'B9_kitchen_sees_nothing FAILED'; END IF;
END $$;

RESET ROLE;
ROLLBACK;

\echo 'ALL WAITER CALL GATES PASSED'
