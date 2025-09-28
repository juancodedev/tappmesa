-- Corregir RLS para customer_order_history que no tiene tenant_id directo

-- Política especial para customer_order_history (acceso vía orders)
CREATE POLICY "customer_order_history_tenant_access" ON customer_order_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = customer_order_history.order_id
      AND (orders.tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    )
  );

-- Mensaje de confirmación
SELECT 'RLS corregido para customer_order_history' as resultado;