-- ============================================================
-- add-idempotency-capability-columns.sql
-- Split 1 (server-data-routes) — task 1.1 / C3 (JD round 1)
--
-- Aditivo y backward-compatible: agrega las columnas e índices
-- únicos que las rutas server de órdenes/sesiones necesitan.
-- No toca grants ni RLS (eso es split 2).
--
--  * orders.idempotency_key      → replay-safe (ON CONFLICT DO NOTHING)
--  * orders.order_number         → único (CSPRNG YYMMDD-XXXXXX con retry ×3)
--  * table_sessions.capability_token → opaque HMAC token (D4), único
--
-- C3 (JD round 1): el índice único sobre orders.order_number NO se puede
-- crear sobre datos legacy tal cual: el order_number histórico usa contadores
-- diarios por tenant (YYMMDD-001) + fallback aleatorio → duplicados
-- garantizados entre productos/temperaturas. Estrategia de reconciliación
-- ANTES del índice (dato preservado, valor único):
--
--   1. Se detectan los duplicados por order_number (rn > 1, el primero por
--      created_at,id se conserva intacto).
--   2. A cada duplicado se le apenda un sufijo determinístico derivado del id
--      de fila: `order_number || '-' || hex(id)[:8]`. El id es globalmente
--      único → sufijo único → order_number único. Ningún dato se pierde: no
--      se borra ni se normaliza, sólo se desambigua.
--   3. Recién entonces se crea el índice único (no falla sobre datos reales).
--
-- Idempotente: se puede correr varias veces sin error (UPDATE sobre datos ya
-- únicos toca 0 filas; los objetos usan IF NOT EXISTS). Todo el lote corre en
-- una transacción: si la reconciliación falla, el índice no se crea.
-- ============================================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Reconciliación C3: desambiguar duplicados legacy ANTES del unique index.
-- `left(replace(id::text, '-', ''), 8)` = 8 hex determinísticos del uuid.
WITH dupes AS (
  SELECT id,
         order_number,
         row_number() OVER (
           PARTITION BY order_number
           ORDER BY created_at NULLS LAST, id
         ) AS rn
    FROM public.orders
   WHERE order_number IS NOT NULL
)
UPDATE public.orders o
   SET order_number = o.order_number || '-' || left(replace(o.id::text, '-', ''), 8)
  FROM dupes d
 WHERE o.id = d.id
   AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key
  ON public.orders (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key
  ON public.orders (order_number);

ALTER TABLE public.table_sessions
  ADD COLUMN IF NOT EXISTS capability_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_capability_token_key
  ON public.table_sessions (capability_token);

COMMIT;