-- Script de Datos de Prueba para Sesiones de Mesa y Reservas
-- TappMesa - Testing de nuevas funcionalidades
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- 1. MESAS DE PRUEBA
-- ============================================

-- Insertar mesas de prueba (ajusta el tenant_id según tu base de datos)
-- Reemplaza 'YOUR_TENANT_ID' con el UUID de tu tenant de prueba

INSERT INTO tables (tenant_id, number, capacity, location, unique_code, status, is_active)
VALUES
  -- Mesa principal de prueba
  ('YOUR_TENANT_ID', 'Mesa Test 1', 4, 'interior', 'TEST12345678', 'available', true),

  -- Mesas adicionales
  ('YOUR_TENANT_ID', 'Mesa Test 2', 2, 'terraza', 'TEST87654321', 'available', true),
  ('YOUR_TENANT_ID', 'Mesa VIP Test', 6, 'privado', 'TESTVIP12345', 'available', true)
ON CONFLICT (tenant_id, number) DO NOTHING;

-- ============================================
-- 2. SESIONES DE MESA DE PRUEBA
-- ============================================

-- Crear sesión activa para Mesa Test 1
INSERT INTO table_sessions (
  tenant_id,
  table_id,
  session_code,
  customer_name,
  customer_phone,
  status,
  total_orders,
  total_amount
)
SELECT
  t.tenant_id,
  t.id,
  'TEST12345678-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
  'Cliente de Prueba',
  '+56912345678',
  'active',
  0,
  0
FROM tables t
WHERE t.tenant_id = 'YOUR_TENANT_ID'
  AND t.number = 'Mesa Test 1'
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. PEDIDOS DE PRUEBA EN DIFERENTES ESTADOS
-- ============================================

-- Pedido PENDIENTE (puede editarse)
INSERT INTO orders (
  tenant_id,
  table_session_id,
  table_number,
  customer_name,
  customer_phone,
  order_number,
  status,
  subtotal,
  tax,
  total,
  estimated_time,
  notes
)
SELECT
  t.tenant_id,
  ts.id,
  t.number,
  'Cliente de Prueba',
  '+56912345678',
  'TEST-' || TO_CHAR(NOW(), 'YYMMDD') || '-001',
  'pending',
  5000,
  950,
  5950,
  15,
  'Pedido de prueba en estado PENDIENTE (editable)'
FROM tables t
JOIN table_sessions ts ON ts.table_id = t.id
WHERE t.tenant_id = 'YOUR_TENANT_ID'
  AND t.number = 'Mesa Test 1'
  AND ts.status = 'active'
LIMIT 1;

-- Pedido EN PREPARACIÓN (no editable)
INSERT INTO orders (
  tenant_id,
  table_session_id,
  table_number,
  customer_name,
  customer_phone,
  order_number,
  status,
  subtotal,
  tax,
  total,
  estimated_time,
  notes
)
SELECT
  t.tenant_id,
  ts.id,
  t.number,
  'Cliente de Prueba',
  '+56912345678',
  'TEST-' || TO_CHAR(NOW(), 'YYMMDD') || '-002',
  'preparing',
  8000,
  1520,
  9520,
  20,
  'Pedido en cocina'
FROM tables t
JOIN table_sessions ts ON ts.table_id = t.id
WHERE t.tenant_id = 'YOUR_TENANT_ID'
  AND t.number = 'Mesa Test 1'
  AND ts.status = 'active'
LIMIT 1;

-- Pedido LISTO (esperando entrega)
INSERT INTO orders (
  tenant_id,
  table_session_id,
  table_number,
  customer_name,
  customer_phone,
  order_number,
  status,
  subtotal,
  tax,
  total,
  estimated_time,
  notes
)
SELECT
  t.tenant_id,
  ts.id,
  t.number,
  'Cliente de Prueba',
  '+56912345678',
  'TEST-' || TO_CHAR(NOW(), 'YYMMDD') || '-003',
  'ready',
  12000,
  2280,
  14280,
  0,
  'Pedido listo para entregar'
FROM tables t
JOIN table_sessions ts ON ts.table_id = t.id
WHERE t.tenant_id = 'YOUR_TENANT_ID'
  AND t.number = 'Mesa Test 1'
  AND ts.status = 'active'
LIMIT 1;

-- ============================================
-- 4. ITEMS DE PEDIDOS (con productos existentes)
-- ============================================

-- Agregar items al primer pedido
-- Asegúrate de tener productos en tu base de datos primero
INSERT INTO order_items (
  order_id,
  product_id,
  quantity,
  unit_price,
  total_price,
  notes
)
SELECT
  o.id,
  p.id,
  2,
  p.price,
  p.price * 2,
  'Temperatura: hot | Sin azúcar'
FROM orders o
CROSS JOIN (
  SELECT id, price
  FROM products
  WHERE tenant_id = 'YOUR_TENANT_ID'
  LIMIT 1
) p
WHERE o.order_number LIKE 'TEST-%'
  AND o.status = 'pending'
LIMIT 1;

-- ============================================
-- 5. RESERVAS DE PRUEBA
-- ============================================

-- Reserva PENDIENTE (hoy)
INSERT INTO reservations (
  tenant_id,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  party_size,
  special_requests,
  status
)
VALUES
  (
    'YOUR_TENANT_ID',
    'María González',
    '+56987654321',
    'maria@example.com',
    CURRENT_DATE,
    '20:00:00',
    4,
    'Celebración de cumpleaños. Mesa cerca de la ventana si es posible.',
    'pending'
  );

-- Reserva CONFIRMADA (mañana)
INSERT INTO reservations (
  tenant_id,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  party_size,
  special_requests,
  status
)
VALUES
  (
    'YOUR_TENANT_ID',
    'Carlos Rodríguez',
    '+56912348765',
    'carlos@example.com',
    CURRENT_DATE + INTERVAL '1 day',
    '13:00:00',
    2,
    'Sin gluten por favor',
    'confirmed'
  );

-- Reserva CANCELADA
INSERT INTO reservations (
  tenant_id,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  party_size,
  special_requests,
  status
)
VALUES
  (
    'YOUR_TENANT_ID',
    'Ana Martínez',
    '+56923456789',
    'ana@example.com',
    CURRENT_DATE - INTERVAL '1 day',
    '19:30:00',
    6,
    'Evento corporativo',
    'cancelled'
  );

-- Reserva COMPLETADA (pasada)
INSERT INTO reservations (
  tenant_id,
  customer_name,
  customer_phone,
  customer_email,
  reservation_date,
  reservation_time,
  party_size,
  special_requests,
  status,
  table_number
)
VALUES
  (
    'YOUR_TENANT_ID',
    'Pedro López',
    '+56934567890',
    'pedro@example.com',
    CURRENT_DATE - INTERVAL '2 days',
    '14:00:00',
    4,
    'Mesa tranquila',
    'completed',
    'Mesa 5'
  );

-- Varias reservas para MAÑANA (para testing de filtros)
INSERT INTO reservations (
  tenant_id,
  customer_name,
  customer_phone,
  reservation_date,
  reservation_time,
  party_size,
  status
)
VALUES
  ('YOUR_TENANT_ID', 'Reserva Test 1', '+56911111111', CURRENT_DATE + INTERVAL '1 day', '12:00:00', 2, 'pending'),
  ('YOUR_TENANT_ID', 'Reserva Test 2', '+56922222222', CURRENT_DATE + INTERVAL '1 day', '14:00:00', 4, 'confirmed'),
  ('YOUR_TENANT_ID', 'Reserva Test 3', '+56933333333', CURRENT_DATE + INTERVAL '1 day', '18:00:00', 6, 'pending'),
  ('YOUR_TENANT_ID', 'Reserva Test 4', '+56944444444', CURRENT_DATE + INTERVAL '1 day', '20:00:00', 3, 'confirmed');

-- ============================================
-- 6. ACTUALIZAR TOTALES DE SESIÓN
-- ============================================

-- Actualizar totales de la sesión de mesa de prueba
UPDATE table_sessions ts
SET
  total_orders = (
    SELECT COUNT(*)
    FROM orders o
    WHERE o.table_session_id = ts.id
  ),
  total_amount = (
    SELECT COALESCE(SUM(total), 0)
    FROM orders o
    WHERE o.table_session_id = ts.id
  )
WHERE ts.session_code LIKE 'TEST%';

-- ============================================
-- 7. VERIFICACIÓN DE DATOS
-- ============================================

-- Ver mesas creadas
SELECT
  number,
  capacity,
  location,
  unique_code,
  status
FROM tables
WHERE number LIKE 'Mesa Test%'
  OR number LIKE 'Mesa VIP Test%';

-- Ver sesiones activas
SELECT
  ts.session_code,
  t.number as table_number,
  ts.customer_name,
  ts.total_orders,
  ts.total_amount,
  ts.status
FROM table_sessions ts
JOIN tables t ON t.id = ts.table_id
WHERE ts.session_code LIKE 'TEST%';

-- Ver pedidos de prueba
SELECT
  order_number,
  status,
  customer_name,
  total,
  created_at
FROM orders
WHERE order_number LIKE 'TEST%'
ORDER BY created_at DESC;

-- Ver reservas de prueba
SELECT
  customer_name,
  reservation_date,
  reservation_time,
  party_size,
  status
FROM reservations
WHERE customer_name LIKE '%Test%'
  OR customer_name IN ('María González', 'Carlos Rodríguez', 'Ana Martínez', 'Pedro López')
ORDER BY reservation_date DESC, reservation_time;

-- ============================================
-- 8. LIMPIEZA (ejecutar cuando termines de probar)
-- ============================================

/*
-- ADVERTENCIA: Esto eliminará TODOS los datos de prueba

-- Eliminar pedidos de prueba y sus items (cascade)
DELETE FROM orders WHERE order_number LIKE 'TEST%';

-- Eliminar sesiones de prueba
DELETE FROM table_sessions WHERE session_code LIKE 'TEST%';

-- Eliminar reservas de prueba
DELETE FROM reservations
WHERE customer_name LIKE '%Test%'
  OR customer_name IN ('María González', 'Carlos Rodríguez', 'Ana Martínez', 'Pedro López');

-- Eliminar mesas de prueba (cascade eliminará sesiones relacionadas)
DELETE FROM tables
WHERE number LIKE 'Mesa Test%'
  OR number LIKE 'Mesa VIP Test%';
*/

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================

/*
1. ANTES DE EJECUTAR:
   - Reemplaza 'YOUR_TENANT_ID' con tu UUID real de tenant
   - Verifica que tengas productos en la base de datos
   - Ejecuta en Supabase SQL Editor

2. PARA OBTENER TU TENANT_ID:
   SELECT id, name, subdomain FROM tenants WHERE is_active = true;

3. PARA VER TUS PRODUCTOS:
   SELECT id, name, price FROM products WHERE tenant_id = 'YOUR_TENANT_ID' LIMIT 5;

4. URLs DE PRUEBA:
   - Mesa: http://[tenant-subdomain].localhost:5173/TEST12345678/menu
   - Reservas: http://[tenant-subdomain].localhost:5173/reservas
   - Admin Reservas: http://[tenant-subdomain].localhost:5173/admin/reservations
   - Admin Pedidos: http://[tenant-subdomain].localhost:5173/admin/orders

5. TESTING RECOMENDADO:
   a) Sesión de Mesa:
      - Escanea QR de mesa test
      - Ve pestaña "Mis Pedidos"
      - Verifica que ves los 3 pedidos
      - Edita el pedido pendiente

   b) Reservas:
      - Ve a /reservas
      - Crea nueva reserva
      - Ve a /admin/reservations
      - Confirma la reserva
      - Prueba filtros

6. LIMPIEZA:
   - Descomenta y ejecuta la sección de LIMPIEZA cuando termines
   - O mantén los datos para demos
*/
