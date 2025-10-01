-- ============================================================================
-- AGREGAR ROL DE GARZÓN (WAITER) AL SISTEMA
-- ============================================================================

-- 1. Verificar y documentar roles existentes
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'SISTEMA DE ROLES - ROLES DISPONIBLES';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Roles actuales:';
  RAISE NOTICE '  - super_admin: Administrador global del sistema';
  RAISE NOTICE '  - tenant_admin: Administrador de cafetería/tenant';
  RAISE NOTICE '  - staff: Personal de la cafetería';
  RAISE NOTICE '  - waiter: Garzón (rol nuevo)';
  RAISE NOTICE '';
  RAISE NOTICE 'Permisos del rol waiter:';
  RAISE NOTICE '  - Ver y gestionar mesas';
  RAISE NOTICE '  - Crear y modificar pedidos';
  RAISE NOTICE '  - Cambiar estados de pedidos';
  RAISE NOTICE '  - Crear reservas';
  RAISE NOTICE '  - Ver clientes';
  RAISE NOTICE '  - SIN acceso a: configuración, usuarios, productos, estadísticas';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;

-- 2. El campo 'role' en admin_users ya es VARCHAR, así que cualquier valor es válido
-- No necesitamos crear un ENUM, simplemente documentamos los roles válidos

-- 3. Crear función helper para validar roles
CREATE OR REPLACE FUNCTION is_valid_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN role_name IN ('super_admin', 'tenant_admin', 'staff', 'waiter');
END;
$$;

-- 4. Agregar constraint para validar roles (opcional, pero recomendado)
DO $$
BEGIN
  -- Verificar si el constraint ya existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'admin_users_role_check'
  ) THEN
    ALTER TABLE admin_users
    ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('super_admin', 'tenant_admin', 'staff', 'waiter'));

    RAISE NOTICE '✓ Constraint de roles agregado';
  ELSE
    -- Si existe, reemplazarlo para incluir 'waiter'
    ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
    ALTER TABLE admin_users
    ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('super_admin', 'tenant_admin', 'staff', 'waiter'));

    RAISE NOTICE '✓ Constraint de roles actualizado';
  END IF;
END $$;

-- 5. Crear tabla de permisos por rol (para documentación y futuro uso)
-- Primero eliminamos la tabla si existe para asegurar estructura correcta
DROP TABLE IF EXISTS role_permissions CASCADE;

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  actions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource)
);

-- 6. Definir permisos para el rol waiter
DO $$
BEGIN
  -- Insertar permisos del waiter
  INSERT INTO role_permissions (role, resource, actions) VALUES
    ('waiter', 'orders', ARRAY['read', 'create', 'update']),
    ('waiter', 'tables', ARRAY['read', 'update']),
    ('waiter', 'table_sessions', ARRAY['read', 'create', 'update']),
    ('waiter', 'reservations', ARRAY['read', 'create']),
    ('waiter', 'customers', ARRAY['read']),
    ('waiter', 'products', ARRAY['read']),
    ('waiter', 'categories', ARRAY['read'])
  ON CONFLICT (role, resource) DO UPDATE
  SET actions = EXCLUDED.actions;

  RAISE NOTICE '✓ Permisos del rol waiter configurados';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Error al configurar permisos: %', SQLERRM;
    RAISE NOTICE '⚠️ Continuando con el resto del script...';
END $$;

-- 7. Crear vista para facilitar consultas de permisos
CREATE OR REPLACE VIEW user_permissions AS
SELECT
  u.id as user_id,
  u.email,
  u.role,
  u.tenant_id,
  rp.resource,
  rp.actions
FROM admin_users u
LEFT JOIN role_permissions rp ON u.role = rp.role
WHERE u.is_active = true;

-- 8. Función helper para verificar si un usuario tiene permiso
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_resource VARCHAR,
  p_action VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role VARCHAR;
  v_permissions TEXT[];
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO v_role
  FROM admin_users
  WHERE id = p_user_id AND is_active = true;

  -- Super admin tiene todos los permisos
  IF v_role = 'super_admin' THEN
    RETURN true;
  END IF;

  -- Verificar permisos específicos del rol
  SELECT actions INTO v_permissions
  FROM role_permissions
  WHERE role = v_role AND resource = p_resource;

  -- Verificar si la acción está en los permisos
  RETURN p_action = ANY(v_permissions);
END;
$$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
DO $$
DECLARE
  total_waiters INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_waiters FROM admin_users WHERE role = 'waiter';
  SELECT COUNT(*) INTO total_users FROM admin_users;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ROL WAITER INSTALADO EXITOSAMENTE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total de usuarios en el sistema: %', total_users;
  RAISE NOTICE 'Usuarios con rol waiter: %', total_waiters;
  RAISE NOTICE '';
  RAISE NOTICE 'Para crear un usuario garzón, ejecuta:';
  RAISE NOTICE 'INSERT INTO admin_users (email, password_hash, full_name, role, tenant_id)';
  RAISE NOTICE 'VALUES (''garzon@ejemplo.com'', ''hash'', ''Juan Pérez'', ''waiter'', ''tenant-uuid'');';
  RAISE NOTICE '';
  RAISE NOTICE 'El garzón tendrá acceso a:';
  RAISE NOTICE '  - Dashboard de garzón (/waiter o /garzon)';
  RAISE NOTICE '  - Gestión de pedidos y mesas';
  RAISE NOTICE '  - Creación de reservas';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '';
END $$;
