-- Fix: creating or editing a user from Admin -> Usuarios fails with 500.
--
--   ERROR: column admin_users.phone does not exist (42703)
--
-- The users form collects a phone and api/admin/users.js writes it on create
-- and update, but admin_users never had the column. Adds it as a nullable
-- VARCHAR: no existing row changes.
--
-- Idempotent, one transaction. Rollback: rollback-add-admin-users-phone.sql

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR;

COMMIT;
