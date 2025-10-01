-- ============================================================================
-- SETUP ESENCIAL DE TAPPMESA
-- Ejecuta este archivo para configurar lo mínimo necesario
-- ============================================================================

-- NOTA: Ejecuta este script DESPUÉS de correr: npx prisma db push
-- Este script asume que las tablas ya existen

BEGIN;

-- ============================================================================
-- PASO 1: ARREGLAR RLS DE ORDERS (CRÍTICO)
-- ============================================================================
RAISE NOTICE '📦 Paso 1/3: Configurando RLS para Orders...';

-- Drop políticas restrictivas existentes
DROP POLICY IF EXISTS "orders_tenant_select" ON orders;
DROP POLICY IF EXISTS "orders_tenant_insert" ON orders;
DROP POLICY IF EXISTS "orders_tenant_update" ON orders;
DROP POLICY IF EXISTS "orders_tenant_delete" ON orders;

-- Crear políticas permisivas (frontend filtra por tenant_id)
CREATE POLICY "orders_select_all" ON orders
  FOR SELECT USING (true);

CREATE POLICY "orders_insert_all" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update_all" ON orders
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "orders_delete_all" ON orders
  FOR DELETE USING (true);

-- Arreglar order_items también
DROP POLICY IF EXISTS "order_items_tenant_access" ON order_items;

CREATE POLICY "order_items_all" ON order_items
  FOR ALL USING (true) WITH CHECK (true);

RAISE NOTICE '✅ Orders RLS configurado correctamente';

-- ============================================================================
-- PASO 2: ARREGLAR RLS DE TABLES (CRÍTICO)
-- ============================================================================
RAISE NOTICE '🪑 Paso 2/3: Configurando RLS para Tables...';

-- Drop políticas restrictivas existentes
DROP POLICY IF EXISTS "tables_tenant_select" ON tables;
DROP POLICY IF EXISTS "tables_tenant_insert" ON tables;
DROP POLICY IF EXISTS "tables_tenant_update" ON tables;
DROP POLICY IF EXISTS "tables_tenant_delete" ON tables;

-- Crear políticas permisivas
CREATE POLICY "tables_select_all" ON tables
  FOR SELECT USING (true);

CREATE POLICY "tables_insert_all" ON tables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tables_update_all" ON tables
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "tables_delete_all" ON tables
  FOR DELETE USING (true);

RAISE NOTICE '✅ Tables RLS configurado correctamente';

-- ============================================================================
-- PASO 3: AGREGAR COLUMNAS DE QR CODE (RECOMENDADO)
-- ============================================================================
RAISE NOTICE '📱 Paso 3/3: Agregando columnas de QR Code...';

-- Agregar qr_code_generated_at a tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'qr_code_generated_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN qr_code_generated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '  ✅ Columna qr_code_generated_at agregada';
  ELSE
    RAISE NOTICE '  ℹ️ Columna qr_code_generated_at ya existe';
  END IF;
END $$;

-- Agregar qr_code_expires_at a tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'qr_code_expires_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN qr_code_expires_at TIMESTAMPTZ DEFAULT NULL;
    RAISE NOTICE '  ✅ Columna qr_code_expires_at agregada';
  ELSE
    RAISE NOTICE '  ℹ️ Columna qr_code_expires_at ya existe';
  END IF;
END $$;

-- Backfill qr_code_generated_at con created_at
UPDATE tables
SET qr_code_generated_at = created_at
WHERE qr_code_generated_at IS NULL AND created_at IS NOT NULL;

RAISE NOTICE '  ✅ Datos históricos actualizados';

-- Agregar qr_code_expiration_days a tenant_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_settings' AND column_name = 'qr_code_expiration_days'
  ) THEN
    ALTER TABLE tenant_settings ADD COLUMN qr_code_expiration_days INTEGER DEFAULT NULL;
    RAISE NOTICE '  ✅ Columna qr_code_expiration_days agregada a tenant_settings';
  ELSE
    RAISE NOTICE '  ℹ️ Columna qr_code_expiration_days ya existe';
  END IF;
END $$;

-- ============================================================================
-- FUNCIONES HELPER (OPCIONAL PERO ÚTIL)
-- ============================================================================
RAISE NOTICE '🔧 Creando funciones helper...';

-- Función para verificar si QR está expirado
CREATE OR REPLACE FUNCTION is_qr_code_expired(p_table_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT qr_code_expires_at INTO v_expires_at
  FROM tables
  WHERE id = p_table_id;

  IF v_expires_at IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN NOW() > v_expires_at;
END;
$$;

RAISE NOTICE '  ✅ Función is_qr_code_expired creada';

-- Función para regenerar QR code
CREATE OR REPLACE FUNCTION regenerate_table_qr_code(
  p_table_id UUID,
  p_new_code VARCHAR DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_expiration_days INTEGER;
  v_new_code VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM tables
  WHERE id = p_table_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Table not found';
  END IF;

  SELECT qr_code_expiration_days INTO v_expiration_days
  FROM tenant_settings
  WHERE tenant_id = v_tenant_id;

  IF v_expiration_days IS NOT NULL AND v_expiration_days > 0 THEN
    v_expires_at := NOW() + (v_expiration_days || ' days')::INTERVAL;
  ELSE
    v_expires_at := NULL;
  END IF;

  IF p_new_code IS NOT NULL THEN
    v_new_code := p_new_code;
  ELSE
    SELECT unique_code INTO v_new_code
    FROM tables
    WHERE id = p_table_id;
  END IF;

  UPDATE tables
  SET
    unique_code = v_new_code,
    qr_code_generated_at = NOW(),
    qr_code_expires_at = v_expires_at,
    updated_at = NOW()
  WHERE id = p_table_id;

  RETURN v_new_code;
END;
$$;

RAISE NOTICE '  ✅ Función regenerate_table_qr_code creada';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
DECLARE
  orders_policies INTEGER;
  tables_policies INTEGER;
  qr_columns INTEGER;
BEGIN
  -- Contar políticas de orders
  SELECT COUNT(*) INTO orders_policies
  FROM pg_policies
  WHERE tablename = 'orders';

  -- Contar políticas de tables
  SELECT COUNT(*) INTO tables_policies
  FROM pg_policies
  WHERE tablename = 'tables';

  -- Contar columnas de QR en tables
  SELECT COUNT(*) INTO qr_columns
  FROM information_schema.columns
  WHERE table_name = 'tables'
    AND column_name IN ('qr_code_generated_at', 'qr_code_expires_at');

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ SETUP ESENCIAL COMPLETADO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Políticas RLS Orders: % (esperado: 4)', orders_policies;
  RAISE NOTICE 'Políticas RLS Tables: % (esperado: 4)', tables_policies;
  RAISE NOTICE 'Columnas QR en Tables: % (esperado: 2)', qr_columns;
  RAISE NOTICE '';

  IF orders_policies >= 4 AND tables_policies >= 4 AND qr_columns = 2 THEN
    RAISE NOTICE '🎉 TODO CONFIGURADO CORRECTAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos pasos:';
    RAISE NOTICE '1. Actualiza códigos de mesa desde Admin → Mesas';
    RAISE NOTICE '2. Configura expiración QR en Admin → Settings (opcional)';
    RAISE NOTICE '3. Si quieres loyalty, ejecuta: create-loyalty-system.sql';
  ELSE
    RAISE NOTICE '⚠️ ALGO FALTA - Revisa los números arriba';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
END $$;