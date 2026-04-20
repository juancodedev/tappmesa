-- =============================================================================
-- FIX RLS POLICIES FOR SUPER ADMIN
-- Ejecuta este script en Supabase SQL Editor
-- =============================================================================

-- 1. POLÍTICAS PARA TABLA TENANTS
-- Permitir a super admins actualizar cualquier tenant
-- =============================================================================

-- Eliminar política existente si existe (para recrearla)
DROP POLICY IF EXISTS "Super admins can update any tenant" ON tenants;

-- Crear política para que super admins puedan actualizar cualquier tenant
CREATE POLICY "Super admins can update any tenant"
ON tenants
FOR UPDATE
TO authenticated
USING (
  -- Verificar que el usuario sea super admin
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
  OR
  -- O que sea tenant admin del mismo tenant
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.tenant_id = tenants.id
  )
)
WITH CHECK (
  -- Misma condición para el check
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.tenant_id = tenants.id
  )
);


-- 2. POLÍTICAS PARA TABLA SUBSCRIPTION_PLANS
-- Permitir a super admins gestionar planes
-- =============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Super admins can view all plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admins can create plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admins can update plans" ON subscription_plans;
DROP POLICY IF EXISTS "Super admins can delete plans" ON subscription_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;

-- Política para ver todos los planes (super admin)
CREATE POLICY "Super admins can view all plans"
ON subscription_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
);

-- Política para crear planes (solo super admin)
CREATE POLICY "Super admins can create plans"
ON subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
);

-- Política para actualizar planes (solo super admin)
CREATE POLICY "Super admins can update plans"
ON subscription_plans
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
);

-- Política para eliminar planes (solo super admin)
CREATE POLICY "Super admins can delete plans"
ON subscription_plans
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
);

-- Política para que usuarios anónimos vean planes activos (para landing page)
CREATE POLICY "Anyone can view active plans"
ON subscription_plans
FOR SELECT
TO anon
USING (is_active = true);


-- 3. POLÍTICAS PARA TABLA SURVEYS
-- Permitir gestión de encuestas
-- =============================================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Admins can manage surveys for their tenant" ON surveys;
DROP POLICY IF EXISTS "Super admins can manage all surveys" ON surveys;

-- Política para tenant admins
CREATE POLICY "Admins can manage surveys for their tenant"
ON surveys
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.tenant_id = surveys.tenant_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.tenant_id = surveys.tenant_id
  )
);

-- Política para super admins
CREATE POLICY "Super admins can manage all surveys"
ON surveys
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.id = auth.uid()
    AND admin_users.role = 'super_admin'
  )
);


-- =============================================================================
-- VERIFICACIÓN: Consultas para verificar que las políticas se crearon
-- =============================================================================

-- Ver todas las políticas de la tabla tenants
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tenants';

-- Ver todas las políticas de la tabla subscription_plans
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'subscription_plans';

-- Ver todas las políticas de la tabla surveys
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'surveys';


-- =============================================================================
-- NOTA IMPORTANTE:
-- =============================================================================
-- Después de ejecutar este script, verifica que tu usuario super admin tenga:
-- 1. role = 'super_admin' en la tabla admin_users
-- 2. tenant_id puede ser NULL para super admins globales
--
-- Para verificar tu usuario:
-- SELECT id, email, role, tenant_id FROM admin_users WHERE email = 'tu-email@ejemplo.com';
-- =============================================================================
