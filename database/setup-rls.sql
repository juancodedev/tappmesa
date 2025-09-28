-- Configuración de Row Level Security para TappMesa
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Habilitar RLS en todas las tablas principales
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- 2. Función para obtener el tenant_id del contexto actual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Intentar obtener desde configuración de sesión
  BEGIN
    tenant_id := (current_setting('app.tenant_id', true))::UUID;
    IF tenant_id IS NOT NULL THEN
      RETURN tenant_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignorar errores de configuración
  END;

  -- Si no hay configuración, devolver NULL (acceso de super admin)
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para verificar si el usuario actual es admin del tenant
CREATE OR REPLACE FUNCTION is_tenant_admin(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- En este caso, usamos el session token en lugar de auth.uid()
  -- porque estamos manejando autenticación personalizada
  current_user_id := (current_setting('app.user_id', true))::UUID;

  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = current_user_id
    AND tenant_id = tenant_uuid
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas para la tabla tenants
CREATE POLICY "tenants_select" ON tenants
  FOR SELECT USING (
    -- Los tenants son visibles para sus propios administradores
    is_tenant_admin(id) OR
    -- O cuando no hay restricción de tenant (super admin o consulta pública limitada)
    get_current_tenant_id() IS NULL
  );

CREATE POLICY "tenants_insert" ON tenants
  FOR INSERT WITH CHECK (
    -- Solo se puede insertar si no hay restricción de tenant (registro inicial)
    get_current_tenant_id() IS NULL
  );

CREATE POLICY "tenants_update" ON tenants
  FOR UPDATE USING (
    is_tenant_admin(id)
  );

-- 5. Políticas para admin_users
CREATE POLICY "admin_users_select" ON admin_users
  FOR SELECT USING (
    tenant_id = get_current_tenant_id() OR
    get_current_tenant_id() IS NULL
  );

CREATE POLICY "admin_users_insert" ON admin_users
  FOR INSERT WITH CHECK (
    tenant_id = get_current_tenant_id() OR
    get_current_tenant_id() IS NULL
  );

CREATE POLICY "admin_users_update" ON admin_users
  FOR UPDATE USING (
    tenant_id = get_current_tenant_id()
  );

-- 6. Políticas para admin_sessions
CREATE POLICY "admin_sessions_all" ON admin_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = admin_sessions.user_id
      AND (admin_users.tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    )
  );

-- 7. Macro para crear políticas estándar de tenant
CREATE OR REPLACE FUNCTION create_tenant_policies(table_name TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('
    CREATE POLICY "%I_tenant_select" ON %I
      FOR SELECT USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

    CREATE POLICY "%I_tenant_insert" ON %I
      FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

    CREATE POLICY "%I_tenant_update" ON %I
      FOR UPDATE USING (tenant_id = get_current_tenant_id());

    CREATE POLICY "%I_tenant_delete" ON %I
      FOR DELETE USING (tenant_id = get_current_tenant_id());
  ', table_name, table_name, table_name, table_name, table_name, table_name, table_name, table_name);
END;
$$ LANGUAGE plpgsql;

-- 8. Aplicar políticas estándar a todas las tablas con tenant_id
SELECT create_tenant_policies('products');
SELECT create_tenant_policies('categories');
SELECT create_tenant_policies('orders');
SELECT create_tenant_policies('customers');
SELECT create_tenant_policies('customer_order_history');
SELECT create_tenant_policies('tables');
SELECT create_tenant_policies('table_sessions');
SELECT create_tenant_policies('restaurant_tables');
SELECT create_tenant_policies('reservations');
SELECT create_tenant_policies('business_hours');
SELECT create_tenant_policies('inventory');
SELECT create_tenant_policies('inventory_movements');
SELECT create_tenant_policies('stock_inventory');
SELECT create_tenant_policies('stock_movements');
SELECT create_tenant_policies('stock_alerts');
SELECT create_tenant_policies('suppliers');
SELECT create_tenant_policies('profiles');
SELECT create_tenant_policies('tenant_settings');
SELECT create_tenant_policies('admin_audit_logs');

-- 9. Política especial para order_items (no tiene tenant_id directo)
CREATE POLICY "order_items_tenant_access" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    )
  );

-- 10. Política para role_permissions (tabla global)
CREATE POLICY "role_permissions_all" ON role_permissions
  FOR SELECT USING (true); -- Solo lectura para todos

-- 11. Función para establecer contexto de tenant
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', tenant_uuid::TEXT, true);
  IF user_uuid IS NOT NULL THEN
    PERFORM set_config('app.user_id', user_uuid::TEXT, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Función para limpiar contexto
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.tenant_id', '', true);
  PERFORM set_config('app.user_id', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Crear índices para mejorar performance de RLS
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_active ON admin_users(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_tenant_available ON products(tenant_id, is_available);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_active ON customers(tenant_id);

-- Mensaje de confirmación
SELECT 'Row Level Security configurado exitosamente para TappMesa' as resultado;