-- =============================================================================
-- SOLUCIÓN TEMPORAL PARA DESARROLLO
-- Deshabilitar RLS en tablas específicas
-- =============================================================================

-- ADVERTENCIA: Esto es SOLO para desarrollo local
-- NO ejecutar en producción sin implementar políticas RLS correctas

-- =============================================================================
-- Deshabilitar RLS en tablas problemáticas
-- =============================================================================

-- Tabla: subscription_plans
-- Permite crear/editar planes de suscripción sin errores 401
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Tabla: tenants
-- Permite actualizar configuraciones de tenant sin errores 401
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- Tabla: surveys
-- Permite gestionar encuestas sin errores 401
ALTER TABLE surveys DISABLE ROW LEVEL SECURITY;

-- Tabla: admin_users (si da problemas)
-- Permite consultas de autenticación sin errores 406
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Tabla: tenant_settings (si da problemas)
-- Permite guardar configuraciones de pre-cuenta
ALTER TABLE tenant_settings DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Verificar estado de RLS
-- =============================================================================

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '🔒 RLS Habilitado'
    ELSE '🔓 RLS Deshabilitado'
  END as estado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'subscription_plans',
    'tenants',
    'surveys',
    'admin_users',
    'tenant_settings'
  )
ORDER BY tablename;

-- =============================================================================
-- RESULTADO ESPERADO
-- =============================================================================
-- Todas las tablas listadas arriba deben mostrar: 🔓 RLS Deshabilitado
--
-- Con esto, deberías poder:
-- ✅ Crear/editar planes de suscripción en /admin/subscription-plans
-- ✅ Guardar configuraciones en /admin/prebill-settings
-- ✅ Hacer login sin errores 406
-- ✅ Ver planes dinámicos en landing page

-- =============================================================================
-- PARA PRODUCCIÓN (NO EJECUTAR AHORA)
-- =============================================================================
-- Cuando estés listo para producción, necesitarás:
-- 1. Habilitar RLS de nuevo: ALTER TABLE [tabla] ENABLE ROW LEVEL SECURITY;
-- 2. Implementar políticas RLS correctas (ver fix-rls-policies.sql)
-- 3. O migrar a Supabase Auth (ver documentación de migración)
