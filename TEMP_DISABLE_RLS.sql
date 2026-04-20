-- =============================================================================
-- SOLUCIÓN TEMPORAL: DESHABILITAR RLS PARA SUPER ADMINS
-- Esta es una solución temporal mientras se configura correctamente la auth
-- =============================================================================

-- OPCIÓN 1: Deshabilitar RLS completamente (NO RECOMENDADO para producción)
-- Solo para desarrollo local
-- =============================================================================

-- Deshabilitar RLS en subscription_plans (TEMPORAL)
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tenants para UPDATE (TEMPORAL)
-- NO ejecutes esto si ya tienes otras políticas importantes
-- ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- OPCIÓN 2: Crear política permisiva para desarrollo (MEJOR)
-- =============================================================================

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Dev: Allow all operations for authenticated users" ON subscription_plans;

-- Crear política temporal permisiva para desarrollo
CREATE POLICY "Dev: Allow all operations for authenticated users"
ON subscription_plans
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- PARA RESTAURAR LA SEGURIDAD DESPUÉS:
-- =============================================================================

-- Habilitar RLS nuevamente
-- ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Eliminar política de desarrollo
-- DROP POLICY IF EXISTS "Dev: Allow all operations for authenticated users" ON subscription_plans;

-- Y volver a ejecutar el script fix-rls-policies.sql
