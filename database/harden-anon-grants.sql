-- SEC-007 — Post-lockdown hardening of anon/authenticated access.
--
-- Run AFTER secure-data-access.sql. The lockdown left these holes, all
-- reachable with the anon key the browser ships:
--
--   1. tenants had RLS disabled while anon held INSERT/UPDATE/DELETE:
--      anyone could rename, re-point or delete any tenant via PostgREST.
--      The policies already exist (tenant_anon_select, tenant_claim); they
--      were simply not enforced. service_role (api/auth/signup.js) bypasses RLS.
--   2. admin_users_backup_insecure (legacy Base64 password hashes) was
--      readable by anon. Export it before applying if you need it.
--   3. user_migration_status and subscription_plans had RLS disabled with
--      write grants (anon and any staff JWT respectively).
--   4. Leftover write grants for anon on menu tables (blocked by RLS today,
--      removed as defense in depth) and an explicit anon/authenticated
--      EXECUTE on tappmesa_place_order: Supabase default privileges grant it
--      directly, so the REVOKE ... FROM PUBLIC in server-order-functions.sql
--      did not remove it.
--
-- Kept on purpose (verify-rls-lockdown.sql gate A8_anon_menu_grants):
-- anon SELECT on menu tables and SELECT/INSERT/UPDATE on reservations.
--
-- Idempotent, one transaction. Rollback: rollback-harden-anon-grants.sql
-- (the dropped backup table is not restored).

BEGIN;

-- 1. tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.tenants FROM anon;

-- 2. legacy insecure password backup
DROP TABLE IF EXISTS public.admin_users_backup_insecure;

-- 3. server-only and super-admin-only tables
ALTER TABLE public.user_migration_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_migration_status FROM anon, authenticated;

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_super_admin ON public.subscription_plans;
CREATE POLICY subscription_plans_super_admin ON public.subscription_plans
  FOR ALL TO authenticated
  USING (app_is_super_admin())
  WITH CHECK (app_is_super_admin());

-- 4. leftover anon write grants and RPC execute
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.categories, public.products, public.tables FROM anon;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.reservations FROM anon;

REVOKE EXECUTE ON FUNCTION public.tappmesa_place_order(uuid, uuid, text, text, jsonb, text)
  FROM anon, authenticated;

COMMIT;
