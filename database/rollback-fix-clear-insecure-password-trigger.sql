-- Rollback of fix-clear-insecure-password-trigger.sql. Restores the previous
-- function, which fails on every password change (no notes column).

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.clear_insecure_password()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.password_hash != OLD.password_hash AND NEW.needs_password_reset = false THEN
    INSERT INTO admin_audit_logs (user_id, tenant_id, action, resource, notes)
    VALUES (NEW.id, NEW.tenant_id, 'password_updated', 'admin_user', 'Password updated to secure bcrypt hash');
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
