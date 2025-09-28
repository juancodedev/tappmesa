-- Funciones de base de datos para TappMesa
-- Ejecutar después de setup-rls.sql

-- 1. Función para obtener productos más vendidos
CREATE OR REPLACE FUNCTION get_top_products(tenant_id_param UUID, limit_param INT DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  total_quantity BIGINT,
  total_revenue NUMERIC,
  category_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue,
    c.name as category_name
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.tenant_id = tenant_id_param
    AND o.status IN ('completed', 'delivered')
  GROUP BY p.id, p.name, c.name
  ORDER BY total_quantity DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función para obtener métricas de ventas del día
CREATE OR REPLACE FUNCTION get_daily_sales_metrics(tenant_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue NUMERIC,
  average_order_value NUMERIC,
  items_sold BIGINT,
  top_payment_method TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(AVG(o.total), 0) as average_order_value,
    COALESCE(SUM(oi.quantity), 0)::BIGINT as items_sold,
    COALESCE(
      (SELECT preference FROM (
        SELECT c.preferred_payment_method as preference, COUNT(*) as cnt
        FROM orders o2
        LEFT JOIN customers c ON o2.customer_phone = c.phone AND c.tenant_id = tenant_id_param
        WHERE o2.tenant_id = tenant_id_param
        AND DATE(o2.created_at) = date_param
        AND c.preferred_payment_method IS NOT NULL
        GROUP BY c.preferred_payment_method
        ORDER BY cnt DESC
        LIMIT 1
      ) as payment_stats),
      'efectivo'
    ) as top_payment_method
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.tenant_id = tenant_id_param
    AND DATE(o.created_at) = date_param
    AND o.status IN ('completed', 'delivered');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Función para obtener métricas de inventario bajo
CREATE OR REPLACE FUNCTION get_low_stock_alerts(tenant_id_param UUID)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  current_stock NUMERIC,
  min_stock NUMERIC,
  percentage_remaining NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    si.current_stock,
    si.min_stock,
    CASE
      WHEN si.min_stock > 0 THEN (si.current_stock / si.min_stock * 100)
      ELSE 100
    END as percentage_remaining
  FROM products p
  JOIN stock_inventory si ON p.id = si.product_id
  WHERE p.tenant_id = tenant_id_param
    AND si.tenant_id = tenant_id_param
    AND si.current_stock <= si.min_stock
    AND p.is_available = true
  ORDER BY percentage_remaining ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para actualizar stock automáticamente después de una orden
CREATE OR REPLACE FUNCTION update_stock_after_order()
RETURNS TRIGGER AS $$
DECLARE
  order_tenant_id UUID;
BEGIN
  -- Obtener tenant_id de la orden
  SELECT tenant_id INTO order_tenant_id FROM orders WHERE id = NEW.order_id;

  -- Actualizar stock si existe inventario para el producto
  UPDATE stock_inventory
  SET current_stock = current_stock - NEW.quantity,
      last_updated = CURRENT_TIMESTAMP
  WHERE tenant_id = order_tenant_id
    AND product_id = NEW.product_id;

  -- Crear movimiento de inventario
  INSERT INTO stock_movements (
    tenant_id,
    product_id,
    stock_inventory_id,
    movement_type,
    quantity,
    reason,
    reference_id,
    reference_type,
    created_by
  )
  SELECT
    order_tenant_id,
    NEW.product_id,
    si.id,
    'salida',
    NEW.quantity,
    'Venta - Orden',
    NEW.order_id,
    'order',
    'system'
  FROM stock_inventory si
  WHERE si.tenant_id = order_tenant_id
    AND si.product_id = NEW.product_id;

  -- Verificar si necesita crear alerta de stock bajo
  INSERT INTO stock_alerts (tenant_id, product_id, alert_type, message)
  SELECT
    si.tenant_id,
    si.product_id,
    'low_stock',
    'Stock bajo: ' || p.name || ' (' || si.current_stock || ' unidades restantes)'
  FROM stock_inventory si
  JOIN products p ON si.product_id = p.id
  WHERE si.tenant_id = order_tenant_id
    AND si.product_id = NEW.product_id
    AND si.current_stock <= si.min_stock
    AND NOT EXISTS (
      SELECT 1 FROM stock_alerts sa
      WHERE sa.tenant_id = si.tenant_id
        AND sa.product_id = si.product_id
        AND sa.alert_type = 'low_stock'
        AND sa.is_resolved = false
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger para actualización automática de stock
DROP TRIGGER IF EXISTS trigger_update_stock_after_order ON order_items;
CREATE TRIGGER trigger_update_stock_after_order
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_after_order();

-- 6. Función para calcular métricas de clientes
CREATE OR REPLACE FUNCTION get_customer_metrics(tenant_id_param UUID, days_back INT DEFAULT 30)
RETURNS TABLE (
  total_customers BIGINT,
  new_customers BIGINT,
  returning_customers BIGINT,
  vip_customers BIGINT,
  average_orders_per_customer NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id)::BIGINT as total_customers,
    COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back THEN c.id END)::BIGINT as new_customers,
    COUNT(DISTINCT CASE WHEN c.total_orders > 1 THEN c.id END)::BIGINT as returning_customers,
    COUNT(DISTINCT CASE WHEN c.is_vip = true THEN c.id END)::BIGINT as vip_customers,
    COALESCE(AVG(c.total_orders), 0) as average_orders_per_customer
  FROM customers c
  WHERE c.tenant_id = tenant_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para generar reporte de ventas por periodo
CREATE OR REPLACE FUNCTION get_sales_report(
  tenant_id_param UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  day_date DATE,
  total_orders BIGINT,
  total_revenue NUMERIC,
  average_order_value NUMERIC,
  items_sold BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(o.created_at) as day_date,
    COUNT(*)::BIGINT as total_orders,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COALESCE(AVG(o.total), 0) as average_order_value,
    COALESCE(SUM(oi.quantity), 0)::BIGINT as items_sold
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  WHERE o.tenant_id = tenant_id_param
    AND DATE(o.created_at) BETWEEN start_date AND end_date
    AND o.status IN ('completed', 'delivered')
  GROUP BY DATE(o.created_at)
  ORDER BY day_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para limpiar sesiones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM admin_sessions
  WHERE expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para validar horarios de operación
CREATE OR REPLACE FUNCTION is_business_open(tenant_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_day INTEGER;
  current_time TIME;
  business_hours_data JSON;
  day_name TEXT;
  is_open BOOLEAN;
BEGIN
  -- Obtener día actual (0 = domingo, 1 = lunes, etc.)
  current_day := EXTRACT(DOW FROM CURRENT_TIMESTAMP);
  current_time := CURRENT_TIME;

  -- Mapear número de día a nombre
  day_name := CASE current_day
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END;

  -- Obtener configuración de horarios
  SELECT business_hours INTO business_hours_data
  FROM tenant_settings
  WHERE tenant_id = tenant_id_param;

  IF business_hours_data IS NULL THEN
    RETURN true; -- Si no hay configuración, asumir abierto
  END IF;

  -- Verificar si está cerrado el día actual
  IF (business_hours_data->day_name->>'closed')::BOOLEAN = true THEN
    RETURN false;
  END IF;

  -- Verificar horario
  is_open := current_time BETWEEN
    (business_hours_data->day_name->>'open')::TIME AND
    (business_hours_data->day_name->>'close')::TIME;

  RETURN is_open;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Función para actualizar estadísticas de cliente después de orden
CREATE OR REPLACE FUNCTION update_customer_stats_after_order()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
BEGIN
  -- Solo actualizar cuando la orden se completa
  IF NEW.status IN ('completed', 'delivered') AND OLD.status != NEW.status THEN

    -- Buscar o crear cliente basado en teléfono
    IF NEW.customer_phone IS NOT NULL THEN
      INSERT INTO customers (tenant_id, phone, name, total_orders, total_spent, last_order_date)
      VALUES (NEW.tenant_id, NEW.customer_phone, NEW.customer_name, 1, NEW.total, NEW.created_at)
      ON CONFLICT (phone)
      DO UPDATE SET
        total_orders = customers.total_orders + 1,
        total_spent = customers.total_spent + NEW.total,
        last_order_date = NEW.created_at,
        name = COALESCE(customers.name, NEW.customer_name);

      -- Crear registro en historial
      INSERT INTO customer_order_history (customer_id, order_id, order_total)
      SELECT c.id, NEW.id, NEW.total
      FROM customers c
      WHERE c.phone = NEW.customer_phone AND c.tenant_id = NEW.tenant_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para estadísticas de cliente
DROP TRIGGER IF EXISTS trigger_update_customer_stats ON orders;
CREATE TRIGGER trigger_update_customer_stats
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats_after_order();

-- Mensaje de confirmación
SELECT 'Funciones de base de datos creadas exitosamente' as resultado;