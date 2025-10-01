-- Migración: Actualizar códigos antiguos de mesas a formato nuevo
-- Códigos antiguos: tenant-slug-mesa-1 → Nuevos: ABCD12345678

-- Función para generar código aleatorio seguro
CREATE OR REPLACE FUNCTION generate_secure_table_code()
RETURNS VARCHAR AS $$
DECLARE
  chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Sin I, O, 0, 1 para evitar confusión
  result VARCHAR := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un código es del formato antiguo
CREATE OR REPLACE FUNCTION is_old_table_code(code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Formato antiguo: tenant-slug-mesa-N (ej: coffee-co-mesa-1)
  RETURN code ~ '^[a-z0-9-]+-mesa-\d+$';
END;
$$ LANGUAGE plpgsql;

-- Ver códigos antiguos que serán migrados
SELECT
  id,
  number,
  unique_code as old_code,
  tenant_id,
  'Will be updated' as status
FROM tables
WHERE is_old_table_code(unique_code)
ORDER BY tenant_id, number;

-- OPCIÓN 1: Migración Automática de TODOS los códigos antiguos
-- CUIDADO: Esto invalidará todos los QR impresos antiguos
-- Solo ejecuta esto si estás seguro
/*
DO $$
DECLARE
  table_record RECORD;
  new_code VARCHAR;
  updated_count INTEGER := 0;
BEGIN
  -- Iterar sobre todas las mesas con códigos antiguos
  FOR table_record IN
    SELECT id, number, unique_code
    FROM tables
    WHERE is_old_table_code(unique_code)
  LOOP
    -- Generar código nuevo único
    LOOP
      new_code := generate_secure_table_code();
      -- Verificar que no existe
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM tables WHERE unique_code = new_code
      );
    END LOOP;

    -- Actualizar tabla
    UPDATE tables
    SET
      unique_code = new_code,
      qr_code_generated_at = NOW(),
      qr_code_expires_at = NULL,
      updated_at = NOW()
    WHERE id = table_record.id;

    updated_count := updated_count + 1;

    RAISE NOTICE 'Mesa % actualizada: % → %',
      table_record.number,
      table_record.unique_code,
      new_code;
  END LOOP;

  RAISE NOTICE 'Total de mesas actualizadas: %', updated_count;
END $$;
*/

-- OPCIÓN 2: Migración de un solo tenant (más seguro)
-- Reemplaza 'ID-DE-TU-TENANT' con el ID real del tenant
/*
DO $$
DECLARE
  table_record RECORD;
  new_code VARCHAR;
  updated_count INTEGER := 0;
  target_tenant_id UUID := 'ID-DE-TU-TENANT'; -- ← CAMBIAR ESTO
BEGIN
  FOR table_record IN
    SELECT id, number, unique_code
    FROM tables
    WHERE tenant_id = target_tenant_id
      AND is_old_table_code(unique_code)
  LOOP
    LOOP
      new_code := generate_secure_table_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM tables WHERE unique_code = new_code
      );
    END LOOP;

    UPDATE tables
    SET
      unique_code = new_code,
      qr_code_generated_at = NOW(),
      qr_code_expires_at = NULL
    WHERE id = table_record.id;

    updated_count := updated_count + 1;

    RAISE NOTICE 'Mesa % actualizada: % → %',
      table_record.number,
      table_record.unique_code,
      new_code;
  END LOOP;

  RAISE NOTICE 'Total de mesas actualizadas para tenant: %', updated_count;
END $$;
*/

-- OPCIÓN 3: Migración de una sola mesa específica
-- Más seguro para pruebas
/*
DO $$
DECLARE
  new_code VARCHAR;
  old_code VARCHAR;
  table_id UUID := 'ID-DE-LA-MESA'; -- ← CAMBIAR ESTO
BEGIN
  -- Obtener código antiguo
  SELECT unique_code INTO old_code
  FROM tables
  WHERE id = table_id;

  -- Verificar que es formato antiguo
  IF NOT is_old_table_code(old_code) THEN
    RAISE NOTICE 'Esta mesa ya tiene código nuevo: %', old_code;
    RETURN;
  END IF;

  -- Generar código nuevo
  LOOP
    new_code := generate_secure_table_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM tables WHERE unique_code = new_code
    );
  END LOOP;

  -- Actualizar
  UPDATE tables
  SET
    unique_code = new_code,
    qr_code_generated_at = NOW(),
    qr_code_expires_at = NULL
  WHERE id = table_id;

  RAISE NOTICE 'Mesa actualizada: % → %', old_code, new_code;
END $$;
*/

-- Ver resultado después de la migración
/*
SELECT
  id,
  number,
  unique_code as new_code,
  qr_code_generated_at,
  CASE
    WHEN is_old_table_code(unique_code) THEN '❌ Formato antiguo'
    ELSE '✅ Formato nuevo'
  END as code_format
FROM tables
ORDER BY tenant_id, number;
*/

-- Contar códigos por formato
SELECT
  CASE
    WHEN is_old_table_code(unique_code) THEN 'Formato Antiguo'
    ELSE 'Formato Nuevo'
  END as formato,
  COUNT(*) as cantidad
FROM tables
GROUP BY
  CASE
    WHEN is_old_table_code(unique_code) THEN 'Formato Antiguo'
    ELSE 'Formato Nuevo'
  END;

COMMENT ON FUNCTION generate_secure_table_code IS
'Genera código aleatorio de 12 caracteres para mesa (formato nuevo)';

COMMENT ON FUNCTION is_old_table_code IS
'Detecta si un código es del formato antiguo (tenant-slug-mesa-N)';