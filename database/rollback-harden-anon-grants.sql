-- Rollback for harden-anon-grants.sql (SEC-007).
-- Restores the previous RLS state and grants. It does NOT recreate
-- admin_users_backup_insecure: restore it from your pre-apply export if needed.

BEGIN;

ALTER TABLE public.tenants DISABLE ROW LEVEL SECURITY;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.tenants TO anon;

ALTER TABLE public.user_migration_status DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.user_migration_status TO anon, authenticated;

DROP POLICY IF EXISTS subscription_plans_super_admin ON public.subscription_plans;
ALTER TABLE public.subscription_plans DISABLE ROW LEVEL SECURITY;

GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.categories, public.products, public.tables TO anon;
GRANT DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.reservations TO anon;

GRANT EXECUTE ON FUNCTION public.tappmesa_place_order(uuid, uuid, text, text, jsonb, text)
  TO anon, authenticated;

COMMIT;
