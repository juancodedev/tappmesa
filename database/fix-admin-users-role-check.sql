-- Fix: creating a kitchen user fails with 500.
--
--   ERROR: new row for relation "admin_users" violates check constraint
--          "admin_users_role_check"
--
-- add-waiter-role.sql limited admin_users.role to super_admin, tenant_admin,
-- staff and waiter. The panel and /api/admin/users also create 'kitchen'
-- (src/utils/staffRoles.js routes it to /kitchen), so every Cocina user
-- failed the insert. This adds 'kitchen' to the constraint and to the
-- is_valid_role helper that documents the same list.
--
-- Existing rows only use the previous roles, so ADD CONSTRAINT validates.
-- Idempotent, one transaction. Rollback: rollback-fix-admin-users-role-check.sql

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'tenant_admin', 'staff', 'waiter', 'kitchen'));

CREATE OR REPLACE FUNCTION public.is_valid_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN role_name IN ('super_admin', 'tenant_admin', 'staff', 'waiter', 'kitchen');
END;
$$;

COMMIT;
