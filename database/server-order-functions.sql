-- ============================================================
-- server-order-functions.sql
-- Split 1 (server-data-routes) — task 1.2
--
-- tappmesa_place_order: colocación de órdenes 100% server-side.
--
-- Diseño (design.md D4/D6):
--   * SECURITY INVOKER + EXECUTE sólo para service_role (las rutas
--     server de Vercel lo invocan vía RPC; el cliente anónimo NUNCA
--     toca orders/order_items directamente — cero acceso anónimo).
--   * Transactional: savepoint interno, rollback parcial ante error.
--   * Precios, IVA (19%) y totales se calculan AQUÍ (server-authoritative);
--     el cliente jamás envía subtotal/tax/total.
--   * Número de orden YYMMDD-XXXXXX único (unique index) con retry ×3,
--     generado con CSPRNG (RTE-001/D7): pgcrypto `gen_random_bytes` con
--     rejection sampling (36*7=252; se descartan bytes 252..255) para
--     un alfabeto de 36 símbolos sin sesgo. El número no es secreto
--     (sale en tickets/QR) pero el spec exige CSPRNG; la unicidad la
--     garantiza el índice + reintento.
--   * Replay-safe: si p_idempotency_key ya existe, devuelve la orden
--     original sin crear duplicados.
--   * Temperatura: se pliega en notes (paridad con CartContext; el modelo
--     order_items no tiene columna temperature).
--
-- Uso (desde la ruta /api/orders, service_role):
--   SELECT * FROM tappmesa_place_order(
--     p_tenant_id, p_table_session_id,
--     p_customer_name, p_customer_phone,
--     '[{"product_id":"<uuid>","quantity":2,"notes":"Temperatura: hot"}]'::jsonb,
--     p_idempotency_key);
-- ============================================================

-- CSPRNG vía pgcrypto (Supabase lo preinstala; idempotente por si el
-- artefacto se aplica en un entorno sin la extensión).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.tappmesa_place_order(
  p_tenant_id         uuid,
  p_table_session_id  uuid,
  p_customer_name     text DEFAULT NULL,
  p_customer_phone    text DEFAULT NULL,
  p_items             jsonb DEFAULT NULL,
  p_idempotency_key   text DEFAULT NULL
)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_session      public.table_sessions%ROWTYPE;
  v_table_number text;
  v_item         jsonb;
  v_product_id   uuid;
  v_quantity     int;
  v_notes        text;
  v_price        numeric(10, 2);
  v_prep_time    int;
  v_subtotal     numeric(10, 2) := 0;
  v_tax          numeric(10, 2) := 0;
  v_total        numeric(10, 2) := 0;
  v_estimated    int := 0;
  v_alphabet     constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_number       text;
  v_rand_byte    int;
  v_order_id     uuid;
  v_attempts     int := 0;
  v_inserted     int;
BEGIN
  -- 1) Validar sesión de mesa (si hay): existe, del tenant, activa.
  --    p_table_session_id NULL = takeout (se resuelve el tenant por Host en la ruta).
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER';
  END IF;

  IF p_table_session_id IS NOT NULL THEN
    SELECT * INTO v_session
      FROM public.table_sessions
     WHERE id = p_table_session_id AND tenant_id = p_tenant_id
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_SESSION';
    END IF;
    IF v_session.status IS DISTINCT FROM 'active' OR v_session.ended_at IS NOT NULL THEN
      RAISE EXCEPTION 'SESSION_CLOSED';
    END IF;

    -- Mesa física (WARNING-1 JD round 1): `orders.table_number` debe ser el
    -- número de la mesa (tables.number), NO el session_code de la sesión.
    -- Deterministic regression del dashboard admin que lee table_number.
    SELECT t.number INTO v_table_number
      FROM public.tables t
     WHERE t.id = v_session.table_id;
    v_table_number := NULLIF(v_table_number, '');
  END IF;

  -- 2) Replay-safe: ya existe una orden para esta idempotency_key → devolverla.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_order_id
      FROM public.orders
     WHERE idempotency_key = p_idempotency_key AND tenant_id = p_tenant_id;
    IF v_order_id IS NOT NULL THEN
      RETURN QUERY SELECT o.* FROM public.orders o WHERE o.id = v_order_id;
      RETURN;
    END IF;
  END IF;

  SAVEPOINT sp_place_order;

  -- 3) Validar items contra el catálogo del tenant (precio server-side).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;
    v_notes      := NULLIF(v_item->>'notes', '');

    IF v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY';
    END IF;

    SELECT price, preparation_time INTO v_price, v_prep_time
      FROM public.products
     WHERE id = v_product_id AND tenant_id = p_tenant_id AND is_available = TRUE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_ITEM';
    END IF;

    v_subtotal := v_subtotal + round(v_quantity * v_price, 2);
    IF v_prep_time IS NOT NULL THEN
      v_estimated := v_estimated + v_prep_time;
    END IF;
  END LOOP;

  v_tax   := round(v_subtotal * 0.19, 2);
  v_total := v_subtotal + v_tax;
  IF v_estimated < 10 THEN
    v_estimated := 10; -- paridad con el flujo actual del carrito
  END IF;

  -- 4) Número de orden único con retry ×3.
  --    CSPRNG (RTE-001/D7): gen_random_bytes con rejection sampling para
  --    36 símbolos sin sesgo (36*7=252; se descartan los bytes 252..255).
  --    La unicidad la garantiza el unique index + ON CONFLICT + reintento.
  LOOP
    v_number := '';
    FOR i IN 1..6 LOOP
      LOOP
        v_rand_byte := get_byte(gen_random_bytes(1), 0);
        EXIT WHEN v_rand_byte < 252;
      END LOOP;
      v_number := v_number || substr(v_alphabet, (v_rand_byte % 36) + 1, 1);
    END LOOP;
    v_number := to_char(now(), 'YYMMDD') || '-' || v_number;

    v_order_id := NULL;
    INSERT INTO public.orders (
      tenant_id, table_session_id, table_number, customer_name, customer_phone,
      status, subtotal, tax, total, notes, order_number, idempotency_key, estimated_time
    ) VALUES (
      p_tenant_id, p_table_session_id,
      v_table_number, p_customer_name, p_customer_phone,
      'pending', v_subtotal, v_tax, v_total, NULL, v_number, p_idempotency_key, v_estimated
    )
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    IF v_inserted = 1 THEN
      EXIT;
    END IF;

    v_attempts := v_attempts + 1;
    IF v_attempts >= 3 THEN
      RAISE EXCEPTION 'ORDER_NUMBER_EXHAUSTED';
    END IF;
  END LOOP;

  -- 5) Line items (precios ya validados; se recalcula por fila).
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity   := (v_item->>'quantity')::int;
    v_notes      := NULLIF(v_item->>'notes', '');

    SELECT price INTO v_price
      FROM public.products
     WHERE id = v_product_id AND tenant_id = p_tenant_id AND is_available = TRUE;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price, notes)
    VALUES (v_order_id, v_product_id, v_quantity, v_price, round(v_quantity * v_price, 2), v_notes);
  END LOOP;

  RELEASE SAVEPOINT sp_place_order;

  RETURN QUERY SELECT o.* FROM public.orders o WHERE o.id = v_order_id;
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK TO SAVEPOINT sp_place_order;
    -- Carrera de doble submit concurrente: la idempotency_key ya existe →
    -- devolver la orden original (replay) en lugar de fallar.
    IF SQLSTATE = '23505' AND p_idempotency_key IS NOT NULL THEN
      SELECT id INTO v_order_id
        FROM public.orders
       WHERE idempotency_key = p_idempotency_key AND tenant_id = p_tenant_id;
      IF v_order_id IS NOT NULL THEN
        RETURN QUERY SELECT o.* FROM public.orders o WHERE o.id = v_order_id;
        RETURN;
      END IF;
    END IF;
    RAISE;
END;
$$;

-- 6) Exponer ÚNICAMENTE a service_role (rutas server). Cero acceso anónimo.
REVOKE ALL ON FUNCTION public.tappmesa_place_order(uuid, uuid, text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tappmesa_place_order(uuid, uuid, text, text, jsonb, text) TO service_role;