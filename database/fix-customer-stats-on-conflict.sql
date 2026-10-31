-- Fix: marking an order delivered/completed fails with 42P10.
--
--   ERROR: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
--
-- trigger_update_customer_stats (AFTER UPDATE ON orders) upserts the customer
-- on the phone column alone, but customers has no unique key on phone: the
-- @@unique([tenant_id, phone]) in prisma/schema.prisma was never applied (only
-- the plain index idx_customers_tenant_phone exists). It fires only when an
-- order with customer_phone moves to completed/delivered.
--
--   1. Add the per-tenant unique key. Production had 0 duplicate
--      (tenant_id, phone) groups when this was written; if CREATE UNIQUE INDEX
--      fails, list them with:
--        SELECT tenant_id, phone, count(*) FROM customers GROUP BY 1, 2 HAVING count(*) > 1;
--   2. Upsert ON CONFLICT (tenant_id, phone). The function stays SECURITY
--      INVOKER: customers_claim already lets the admin write its own tenant.
--
-- Idempotent, one transaction. Rollback: rollback-fix-customer-stats-on-conflict.sql

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_phone_key
  ON public.customers (tenant_id, phone);

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
      ON CONFLICT (tenant_id, phone)
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

COMMIT;
