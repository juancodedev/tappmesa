-- Rollback of fix-admin-users-role-check.sql. Fails if any admin_users row
-- already uses 'kitchen': change or remove those users first.

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('super_admin', 'tenant_admin', 'staff', 'waiter'));

CREATE OR REPLACE FUNCTION public.is_valid_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN role_name IN ('super_admin', 'tenant_admin', 'staff', 'waiter');
END;
$$;

COMMIT;
