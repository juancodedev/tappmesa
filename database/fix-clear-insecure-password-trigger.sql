-- Fix: changing a user's password from Admin -> Usuarios fails with 500.
--
--   ERROR: column of relation "admin_audit_logs" does not exist (42703)
--
-- trigger_clear_insecure_password (AFTER UPDATE ON admin_users, from
-- migrate-to-secure-auth.sql) writes an audit row when password_hash changes,
-- using a free-text column admin_audit_logs never had. The error aborts the UPDATE, so
-- every password change failed. The message moves to new_values (jsonb).
--
-- Idempotent, one transaction. Rollback: rollback-fix-clear-insecure-password-trigger.sql

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.clear_insecure_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.password_hash != OLD.password_hash AND NEW.needs_password_reset = false THEN
    INSERT INTO admin_audit_logs (user_id, tenant_id, action, resource, resource_id, new_values)
    VALUES (
      NEW.id,
      NEW.tenant_id,
      'password_updated',
      'admin_user',
      NEW.id,
      jsonb_build_object('message', 'Password updated to secure bcrypt hash')
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
