-- SQL Migration: Add refresh_token to admin_sessions
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS refresh_token VARCHAR UNIQUE;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_refresh ON admin_sessions(refresh_token);
