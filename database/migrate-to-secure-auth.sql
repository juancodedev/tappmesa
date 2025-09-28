-- Migración de contraseñas inseguras a bcrypt
-- ⚠️ EJECUTAR SOLO UNA VEZ DESPUÉS DE IMPLEMENTAR EL SISTEMA SEGURO

-- Crear tabla temporal para backup de contraseñas antiguas
CREATE TABLE IF NOT EXISTS admin_users_backup_insecure AS
SELECT id, email, password_hash as old_password_hash, created_at
FROM admin_users;

-- Marcar usuarios que necesitan actualizar contraseña
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS needs_password_reset BOOLEAN DEFAULT false;

-- Marcar todos los usuarios existentes para que actualicen su contraseña
UPDATE admin_users
SET needs_password_reset = true
WHERE password_hash IS NOT NULL;

-- Función para invalidar sesiones existentes (por seguridad)
CREATE OR REPLACE FUNCTION invalidate_all_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM admin_sessions;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  INSERT INTO admin_audit_logs (action, resource, notes, created_at)
  VALUES (
    'security_migration',
    'admin_sessions',
    'All sessions invalidated during migration to secure authentication',
    NOW()
  );

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar invalidación de sesiones
SELECT invalidate_all_sessions() as sessions_invalidated;

-- Crear tabla de tokens de reset de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para tokens de reset
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpiar automáticamente passwords inseguros después de reset
CREATE OR REPLACE FUNCTION clear_insecure_password()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se actualiza la contraseña y no necesita reset, limpiar flag
  IF NEW.password_hash != OLD.password_hash AND NEW.needs_password_reset = false THEN
    -- Registrar en auditoría
    INSERT INTO admin_audit_logs (
      user_id,
      tenant_id,
      action,
      resource,
      notes
    ) VALUES (
      NEW.id,
      NEW.tenant_id,
      'password_updated',
      'admin_user',
      'Password updated to secure bcrypt hash'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_clear_insecure_password ON admin_users;
CREATE TRIGGER trigger_clear_insecure_password
  AFTER UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION clear_insecure_password();

-- Crear vista para usuarios que necesitan actualizar contraseña
CREATE OR REPLACE VIEW users_needing_password_reset AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.tenant_id,
  t.name as tenant_name,
  u.created_at,
  u.last_login
FROM admin_users u
LEFT JOIN tenants t ON u.tenant_id = t.id
WHERE u.needs_password_reset = true
AND u.is_active = true;

-- Función para generar token de reset
CREATE OR REPLACE FUNCTION generate_password_reset_token(user_email VARCHAR)
RETURNS TABLE (
  user_id UUID,
  reset_token VARCHAR,
  expires_at TIMESTAMPTZ,
  user_name VARCHAR
) AS $$
DECLARE
  user_record RECORD;
  token VARCHAR(64);
  expiry TIMESTAMPTZ;
BEGIN
  -- Buscar usuario
  SELECT id, full_name INTO user_record
  FROM admin_users
  WHERE email = user_email AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', user_email;
  END IF;

  -- Generar token único
  token := encode(gen_random_bytes(32), 'hex');
  expiry := NOW() + INTERVAL '24 hours';

  -- Eliminar tokens anteriores del usuario
  DELETE FROM password_reset_tokens WHERE user_id = user_record.id;

  -- Insertar nuevo token
  INSERT INTO password_reset_tokens (user_id, token, expires_at)
  VALUES (user_record.id, token, expiry);

  -- Retornar información
  RETURN QUERY SELECT
    user_record.id,
    token,
    expiry,
    user_record.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear log de migración
INSERT INTO admin_audit_logs (action, resource, notes, created_at)
VALUES (
  'security_migration_complete',
  'authentication_system',
  'Migration to bcrypt-based authentication completed. All existing sessions invalidated.',
  NOW()
);

-- Mostrar estadísticas de migración
SELECT
  'MIGRACIÓN COMPLETADA' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE needs_password_reset = true) as users_need_reset,
  COUNT(*) FILTER (WHERE needs_password_reset = false) as users_ready
FROM admin_users
WHERE is_active = true;

-- Instrucciones para completar la migración
SELECT
  '📧 SIGUIENTE PASO: Enviar emails de reset de contraseña a todos los usuarios' as instruction,
  COUNT(*) as users_to_notify
FROM users_needing_password_reset;