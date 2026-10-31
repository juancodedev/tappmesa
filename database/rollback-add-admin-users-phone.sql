-- Rollback of add-admin-users-phone.sql. Drops the phones already saved.

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.admin_users DROP COLUMN IF EXISTS phone;

COMMIT;
