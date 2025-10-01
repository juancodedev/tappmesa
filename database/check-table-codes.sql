-- Query para verificar los códigos de mesa actuales

-- 1. Ver TODOS los códigos y su formato
SELECT
  t.id,
  te.name as tenant_name,
  t.number as mesa_numero,
  t.unique_code,
  LENGTH(t.unique_code) as longitud,
  CASE
    WHEN t.unique_code ~ '^[A-Z0-9]{8,12}$' THEN '✅ Nuevo formato'
    WHEN t.unique_code ~ '^[a-z0-9-]+-mesa-\d+$' THEN '⚠️ Formato antiguo'
    ELSE '❓ Formato desconocido'
  END as formato
FROM tables t
JOIN tenants te ON t.tenant_id = te.id
ORDER BY te.name, t.number;

-- 2. Contar por formato
SELECT
  CASE
    WHEN unique_code ~ '^[A-Z0-9]{8,12}$' THEN 'Nuevo formato'
    WHEN unique_code ~ '^[a-z0-9-]+-mesa-\d+$' THEN 'Formato antiguo'
    ELSE 'Formato desconocido'
  END as formato,
  COUNT(*) as cantidad
FROM tables
GROUP BY
  CASE
    WHEN unique_code ~ '^[A-Z0-9]{8,12}$' THEN 'Nuevo formato'
    WHEN unique_code ~ '^[a-z0-9-]+-mesa-\d+$' THEN 'Formato antiguo'
    ELSE 'Formato desconocido'
  END;

-- 3. Ver solo códigos antiguos (los que deberían migrarse)
SELECT
  te.name as tenant_name,
  t.number as mesa_numero,
  t.unique_code as codigo_antiguo
FROM tables t
JOIN tenants te ON t.tenant_id = te.id
WHERE t.unique_code ~ '^[a-z0-9-]+-mesa-\d+$'
ORDER BY te.name, t.number;

-- 4. Ver ejemplos de códigos para debugging
SELECT
  unique_code,
  unique_code ~ '^[a-z0-9-]+-mesa-\d+$' as es_antiguo,
  unique_code ~ '^[A-Z0-9]{8,12}$' as es_nuevo
FROM tables
LIMIT 10;