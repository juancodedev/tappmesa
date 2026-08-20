-- Corregir función de generación de tokens de reset

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

  -- Eliminar tokens anteriores del usuario (especificar tabla explícitamente)
  DELETE FROM password_reset_tokens WHERE password_reset_tokens.user_id = user_record.id;

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

SELECT 'Función generate_password_reset_token corregida' as resultado;