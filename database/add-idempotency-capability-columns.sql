-- ============================================================
-- add-idempotency-capability-columns.sql
-- Split 1 (server-data-routes) — task 1.1
--
-- Aditivo y backward-compatible: agrega las columnas e índices
-- únicos que las rutas server de órdenes/sesiones necesitan.
-- No toca grants ni RLS (eso es split 2).
--
--  * orders.idempotency_key      → replay-safe (ON CONFLICT DO NOTHING)
--  * orders.order_number         → único (CSPRNG YYMMDD-XXXXXX con retry ×3)
--  * table_sessions.capability_token → opaque HMAC token (D4), único
--
-- Idempotente: se puede correr varias veces sin error.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key
  ON public.orders (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key
  ON public.orders (order_number);

ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS capability_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_capability_token_key
  ON public.table_sessions (capability_token);