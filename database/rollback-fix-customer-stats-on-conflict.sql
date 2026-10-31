-- Rollback of fix-customer-stats-on-conflict.sql: restores the previous
-- trigger function (ON CONFLICT (phone), which fails with 42P10) and drops
-- the unique key.

BEGIN;

CREATE OR REPLACE FUNCTION public.update_customer_stats_after_order()
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
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp;

DROP INDEX IF EXISTS public.customers_tenant_phone_key;

COMMIT;
