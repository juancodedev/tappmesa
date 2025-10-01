-- ============================================================================
-- SETUP ESENCIAL DE TAPPMESA - VERSIÓN SEGURA (IDEMPOTENTE)
-- Se puede ejecutar múltiples veces sin errores
-- ============================================================================

-- NOTA: Ejecuta este script DESPUÉS de correr: npx prisma db push
-- Este script asume que las tablas ya existen

-- ============================================================================
-- PASO 1: LIMPIAR Y RECREAR RLS DE ORDERS
-- ============================================================================

-- Función helper para recrear política de forma segura
DO $$
BEGIN
  -- Drop todas las políticas de orders
  DROP POLICY IF EXISTS "orders_tenant_select" ON orders;
  DROP POLICY IF EXISTS "orders_tenant_insert" ON orders;
  DROP POLICY IF EXISTS "orders_tenant_update" ON orders;
  DROP POLICY IF EXISTS "orders_tenant_delete" ON orders;
  DROP POLICY IF EXISTS "orders_select_all" ON orders;
  DROP POLICY IF EXISTS "orders_insert_all" ON orders;
  DROP POLICY IF EXISTS "orders_update_all" ON orders;
  DROP POLICY IF EXISTS "orders_delete_all" ON orders;

  -- Crear políticas permisivas
  CREATE POLICY "orders_select_all" ON orders
    FOR SELECT USING (true);

  CREATE POLICY "orders_insert_all" ON orders
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "orders_update_all" ON orders
    FOR UPDATE USING (true) WITH CHECK (true);

  CREATE POLICY "orders_delete_all" ON orders
    FOR DELETE USING (true);

  RAISE NOTICE 'Orders RLS configurado';
END $$;

-- Arreglar order_items también
DO $$
BEGIN
  DROP POLICY IF EXISTS "order_items_tenant_access" ON order_items;
  DROP POLICY IF EXISTS "order_items_all" ON order_items;

  CREATE POLICY "order_items_all" ON order_items
    FOR ALL USING (true) WITH CHECK (true);

  RAISE NOTICE 'Order Items RLS configurado';
END $$;

-- ============================================================================
-- PASO 2: LIMPIAR Y RECREAR RLS DE TABLES
-- ============================================================================

DO $$
BEGIN
  -- Drop todas las políticas de tables
  DROP POLICY IF EXISTS "tables_tenant_select" ON tables;
  DROP POLICY IF EXISTS "tables_tenant_insert" ON tables;
  DROP POLICY IF EXISTS "tables_tenant_update" ON tables;
  DROP POLICY IF EXISTS "tables_tenant_delete" ON tables;
  DROP POLICY IF EXISTS "tables_select_all" ON tables;
  DROP POLICY IF EXISTS "tables_insert_all" ON tables;
  DROP POLICY IF EXISTS "tables_update_all" ON tables;
  DROP POLICY IF EXISTS "tables_delete_all" ON tables;

  -- Crear políticas permisivas
  CREATE POLICY "tables_select_all" ON tables
    FOR SELECT USING (true);

  CREATE POLICY "tables_insert_all" ON tables
    FOR INSERT WITH CHECK (true);

  CREATE POLICY "tables_update_all" ON tables
    FOR UPDATE USING (true) WITH CHECK (true);

  CREATE POLICY "tables_delete_all" ON tables
    FOR DELETE USING (true);

  RAISE NOTICE 'Tables RLS configurado';
END $$;

-- ============================================================================
-- PASO 3: AGREGAR COLUMNAS DE QR CODE (SI NO EXISTEN)
-- ============================================================================

-- Agregar updated_at a tables (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Columna updated_at agregada';
  ELSE
    RAISE NOTICE 'Columna updated_at ya existe';
  END IF;
END $$;

-- Agregar qr_code_generated_at a tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tables' AND column_name = 'qr_code_generated_at'
  ) THEN
    ALTER TABLE tables ADD COLUMN qr_code_generated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Columna qr_code_generated_at agregada';
  ELSE
    RAISE NOTICE 'Columna qr_code_generated_at ya existe';
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
    RAISE NOTICE 'Columna qr_code_expires_at agregada';
  ELSE
    RAISE NOTICE 'Columna qr_code_expires_at ya existe';
  END IF;
END $$;

-- Backfill qr_code_generated_at con created_at (si es necesario)
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE tables
  SET qr_code_generated_at = created_at
  WHERE qr_code_generated_at IS NULL AND created_at IS NOT NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated > 0 THEN
    RAISE NOTICE 'Datos historicos actualizados: % filas', rows_updated;
  ELSE
    RAISE NOTICE 'Datos historicos ya actualizados';
  END IF;
END $$;

-- Agregar qr_code_expiration_days a tenant_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_settings' AND column_name = 'qr_code_expiration_days'
  ) THEN
    ALTER TABLE tenant_settings ADD COLUMN qr_code_expiration_days INTEGER DEFAULT NULL;
    RAISE NOTICE 'Columna qr_code_expiration_days agregada';
  ELSE
    RAISE NOTICE 'Columna qr_code_expiration_days ya existe';
  END IF;
END $$;

-- ============================================================================
-- PASO 4: CREAR/RECREAR FUNCIONES HELPER
-- ============================================================================

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
    AND column_name IN ('updated_at', 'qr_code_generated_at', 'qr_code_expires_at');

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'SETUP ESENCIAL COMPLETADO';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Politicas RLS Orders: % (esperado: 4)', orders_policies;
  RAISE NOTICE 'Politicas RLS Tables: % (esperado: 4)', tables_policies;
  RAISE NOTICE 'Columnas QR en Tables: % (esperado: 3)', qr_columns;
  RAISE NOTICE '';

  IF orders_policies >= 4 AND tables_policies >= 4 AND qr_columns = 3 THEN
    RAISE NOTICE 'TODO CONFIGURADO CORRECTAMENTE';
    RAISE NOTICE '';
    RAISE NOTICE 'Proximos pasos:';
    RAISE NOTICE '1. Actualiza codigos de mesa desde Admin - Mesas';
    RAISE NOTICE '2. Configura expiracion QR en Admin - Settings (opcional)';
    RAISE NOTICE '3. Si quieres loyalty, ejecuta: create-loyalty-system.sql';
  ELSE
    RAISE NOTICE 'ALGO FALTA - Revisa los numeros arriba';
  END IF;

  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;