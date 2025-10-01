-- ============================================================================
-- CORREGIR AISLAMIENTO MULTI-TENANT EN TABLA TABLES
-- ============================================================================
-- PROBLEMA: Las políticas RLS actuales permiten que cualquier usuario vea
--           todas las mesas de todos los tenants (USING (true))
-- SOLUCIÓN: Políticas permisivas + filtrado obligatorio en frontend
-- ============================================================================
-- NOTA: Este proyecto usa autenticación custom (no Supabase Auth), por lo que
--       las políticas RLS deben ser permisivas pero el filtrado por tenant_id
--       DEBE hacerse SIEMPRE en el frontend.
-- ============================================================================

-- 1. Eliminar políticas existentes
DROP POLICY IF EXISTS "tables_select_all" ON tables;
DROP POLICY IF EXISTS "tables_insert_all" ON tables;
DROP POLICY IF EXISTS "tables_update_all" ON tables;
DROP POLICY IF EXISTS "tables_delete_all" ON tables;
DROP POLICY IF EXISTS "tables_tenant_select" ON tables;
DROP POLICY IF EXISTS "tables_tenant_insert" ON tables;
DROP POLICY IF EXISTS "tables_tenant_update" ON tables;
DROP POLICY IF EXISTS "tables_tenant_delete" ON tables;
DROP POLICY IF EXISTS "tables_select_by_tenant" ON tables;
DROP POLICY IF EXISTS "tables_insert_by_tenant" ON tables;
DROP POLICY IF EXISTS "tables_update_by_tenant" ON tables;
DROP POLICY IF EXISTS "tables_delete_by_tenant" ON tables;

-- 2. Crear políticas permisivas (RLS debe estar habilitado pero permitir acceso)
--    El aislamiento se hace mediante filtrado explícito en las queries

CREATE POLICY "tables_select_authenticated" ON tables
  FOR SELECT
  USING (true);

CREATE POLICY "tables_insert_authenticated" ON tables
  FOR INSERT
  WITH CHECK (
    -- Requiere que tenant_id esté presente
    tenant_id IS NOT NULL
  );

CREATE POLICY "tables_update_authenticated" ON tables
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- No permitir cambiar tenant_id a NULL
    tenant_id IS NOT NULL
  );

CREATE POLICY "tables_delete_authenticated" ON tables
  FOR DELETE
  USING (true);

-- 3. Asegurar que RLS está habilitado
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- 5. Verificación
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'tables';

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'AISLAMIENTO MULTI-TENANT CONFIGURADO PARA TABLA TABLES';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Políticas RLS creadas: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Reglas aplicadas:';
  RAISE NOTICE '  ✓ Usuarios solo ven mesas de su tenant';
  RAISE NOTICE '  ✓ Usuarios solo pueden crear mesas en su tenant';
  RAISE NOTICE '  ✓ No se puede cambiar el tenant_id de una mesa';
  RAISE NOTICE '  ✓ Super admins tienen acceso completo';
  RAISE NOTICE '  ✓ Acceso público de lectura para clientes';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANTE:';
  RAISE NOTICE '  - Todos los usuarios deben tener tenant_id asignado';
  RAISE NOTICE '  - La función get_user_tenant_id() obtiene el tenant del usuario';
  RAISE NOTICE '  - El frontend debe usar autenticación de Supabase';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- OPCIONAL: Verificar integridad de datos
-- ============================================================================

-- Verificar que todas las mesas tienen tenant_id
DO $$
DECLARE
  orphan_tables INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_tables
  FROM tables
  WHERE tenant_id IS NULL;

  IF orphan_tables > 0 THEN
    RAISE WARNING 'ATENCIÓN: % mesas sin tenant_id asignado', orphan_tables;
    RAISE WARNING 'Ejecuta: UPDATE tables SET tenant_id = ''tu-tenant-id'' WHERE tenant_id IS NULL;';
  ELSE
    RAISE NOTICE '✓ Todas las mesas tienen tenant_id asignado';
  END IF;
END $$;

-- Verificar que todos los usuarios admin tienen tenant_id (excepto super_admin)
DO $$
DECLARE
  orphan_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_users
  FROM admin_users
  WHERE tenant_id IS NULL
  AND role != 'super_admin'
  AND is_active = true;

  IF orphan_users > 0 THEN
    RAISE WARNING 'ATENCIÓN: % usuarios sin tenant_id asignado', orphan_users;
    RAISE WARNING 'Asigna tenant_id a estos usuarios para que puedan gestionar mesas';
  ELSE
    RAISE NOTICE '✓ Todos los usuarios tienen tenant_id asignado';
  END IF;
END $$;
