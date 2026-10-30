-- database/analytics-functions.sql
--
-- Analytics for /admin/analytics (tenant admin) and the super admin.
--
-- get_analytics(p_tenant_id, p_from, p_to) returns every dashboard section in
-- one jsonb document. p_tenant_id = NULL means "all locals" (super admin only).
-- The range is half-open: [p_from, p_to).
--
-- SECURITY: SECURITY INVOKER on purpose. The caller's RLS (orders_claim and
-- friends in secure-data-access.sql) keeps scoping rows, so a bug in the
-- filters below can never leak another tenant's data. The role check mirrors
-- the UI permission analytics:read (tenant_admin, super_admin).
--
-- Metric definitions (days and hours bucketed in America/Santiago):
--   sales             sum of total of 'delivered' orders
--   orders            count of 'delivered' orders
--   average_ticket    sales / orders
--   cancellation_rate 'cancelled' orders / all orders in the period
--   previous          same summary for the previous period of equal length
--   daily, hourly     delivered sales and orders per local day / hour (0-23)
--   in_progress       current 'pending' / 'preparing' / 'ready' counts (no range)
--   top_products      top 10 by units (delivered orders)
--   categories        units and revenue per category (delivered orders)
--   tables            sales and orders per table_number (NULL = no table)
--   locals            per-tenant ranking, only when p_tenant_id IS NULL
--
-- Verify: psql -f scripts/verify-analytics.sql (add -v lab=1 on a lab only).
-- Rollback: database/rollback-analytics-functions.sql.

-- Range filters. Plain CREATE INDEX briefly blocks writes on these tables;
-- run in a quiet window or create them CONCURRENTLY by hand first.
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created_at ON public.orders (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

CREATE OR REPLACE FUNCTION public.get_analytics(
  p_tenant_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tz CONSTANT text := 'America/Santiago';
  v_role text := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'app_role';
  v_prev_from timestamptz;
  v_result jsonb;
BEGIN
  IF v_role IS NULL OR v_role NOT IN ('tenant_admin', 'super_admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF NOT public.app_is_super_admin()
     AND (p_tenant_id IS NULL OR p_tenant_id IS DISTINCT FROM public.app_claim_tenant_id()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_to IS NULL OR p_to <= p_from THEN
    RAISE EXCEPTION 'invalid_range' USING ERRCODE = '22023';
  END IF;

  v_prev_from := p_from - (p_to - p_from);

  WITH scoped AS (
    SELECT o.id, o.tenant_id, o.status, o.total, o.table_number, o.created_at,
           o.created_at >= p_from AS is_current
    FROM orders o
    WHERE (p_tenant_id IS NULL OR o.tenant_id = p_tenant_id)
      AND o.created_at >= v_prev_from
      AND o.created_at < p_to
  ),
  delivered AS (
    SELECT * FROM scoped WHERE is_current AND status = 'delivered'
  ),
  summary AS (
    SELECT is_current,
           sum(total) FILTER (WHERE status = 'delivered') AS sales,
           count(*) FILTER (WHERE status = 'delivered') AS orders,
           count(*) FILTER (WHERE status = 'cancelled') AS cancelled,
           count(*) AS total_orders
    FROM scoped
    GROUP BY is_current
  ),
  items AS (
    SELECT oi.product_id, oi.quantity, oi.total_price,
           p.name AS product_name, p.category_id, c.name AS category_name
    FROM delivered d
    JOIN order_items oi ON oi.order_id = d.id
    LEFT JOIN products p ON p.id = oi.product_id
    LEFT JOIN categories c ON c.id = p.category_id
  )
  SELECT jsonb_build_object(
    'summary', (
      SELECT jsonb_object_agg(v.label, jsonb_build_object(
        'sales', coalesce(s.sales, 0),
        'orders', coalesce(s.orders, 0),
        'average_ticket', CASE WHEN s.orders > 0 THEN round(s.sales / s.orders, 2) ELSE 0 END,
        'cancelled', coalesce(s.cancelled, 0),
        'total_orders', coalesce(s.total_orders, 0),
        'cancellation_rate', CASE WHEN s.total_orders > 0
                                  THEN round(s.cancelled::numeric / s.total_orders, 4) ELSE 0 END
      ))
      FROM (VALUES (true, 'current'), (false, 'previous')) AS v(flag, label)
      LEFT JOIN summary s ON s.is_current = v.flag
    ),
    'daily', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', d.day::date,
        'sales', coalesce(x.sales, 0),
        'orders', coalesce(x.orders, 0)
      ) ORDER BY d.day)
      FROM generate_series(
        (p_from AT TIME ZONE v_tz)::date,
        ((p_to - interval '1 microsecond') AT TIME ZONE v_tz)::date,
        interval '1 day'
      ) AS d(day)
      LEFT JOIN (
        SELECT (created_at AT TIME ZONE v_tz)::date AS day, sum(total) AS sales, count(*) AS orders
        FROM delivered
        GROUP BY 1
      ) x ON x.day = d.day::date
    ),
    'hourly', (
      SELECT jsonb_agg(jsonb_build_object(
        'hour', h.hour,
        'sales', coalesce(x.sales, 0),
        'orders', coalesce(x.orders, 0)
      ) ORDER BY h.hour)
      FROM generate_series(0, 23) AS h(hour)
      LEFT JOIN (
        SELECT extract(hour FROM created_at AT TIME ZONE v_tz)::int AS hour, sum(total) AS sales, count(*) AS orders
        FROM delivered
        GROUP BY 1
      ) x ON x.hour = h.hour
    ),
    'in_progress', (
      SELECT jsonb_build_object(
        'pending', count(*) FILTER (WHERE o.status = 'pending'),
        'preparing', count(*) FILTER (WHERE o.status = 'preparing'),
        'ready', count(*) FILTER (WHERE o.status = 'ready')
      )
      FROM orders o
      WHERE (p_tenant_id IS NULL OR o.tenant_id = p_tenant_id)
        AND o.status IN ('pending', 'preparing', 'ready')
    ),
    'top_products', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.units DESC, t.revenue DESC, t.name), '[]'::jsonb)
      FROM (
        SELECT product_id, product_name AS name, category_name AS category,
               sum(quantity) AS units, sum(total_price) AS revenue
        FROM items
        GROUP BY product_id, product_name, category_name
        ORDER BY units DESC, revenue DESC, name
        LIMIT 10
      ) t
    ),
    'categories', (
      SELECT coalesce(jsonb_agg(c ORDER BY c.revenue DESC, c.name), '[]'::jsonb)
      FROM (
        SELECT category_id, category_name AS name, sum(quantity) AS units, sum(total_price) AS revenue
        FROM items
        GROUP BY category_id, category_name
      ) c
    ),
    'tables', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.sales DESC, t.table_number NULLS FIRST), '[]'::jsonb)
      FROM (
        SELECT nullif(btrim(table_number), '') AS table_number, sum(total) AS sales, count(*) AS orders
        FROM delivered
        GROUP BY 1
      ) t
    ),
    'locals', CASE WHEN p_tenant_id IS NULL THEN (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'tenant_id', tn.id,
        'name', tn.name,
        'is_active', tn.is_active,
        'sales', coalesce(l.sales, 0),
        'orders', coalesce(l.orders, 0),
        'average_ticket', CASE WHEN l.orders > 0 THEN round(l.sales / l.orders, 2) ELSE 0 END,
        'cancellation_rate', CASE WHEN l.total_orders > 0
                                  THEN round(l.cancelled::numeric / l.total_orders, 4) ELSE 0 END
      ) ORDER BY coalesce(l.sales, 0) DESC, tn.name), '[]'::jsonb)
      FROM tenants tn
      LEFT JOIN (
        SELECT tenant_id,
               sum(total) FILTER (WHERE status = 'delivered') AS sales,
               count(*) FILTER (WHERE status = 'delivered') AS orders,
               count(*) FILTER (WHERE status = 'cancelled') AS cancelled,
               count(*) AS total_orders
        FROM scoped
        WHERE is_current
        GROUP BY tenant_id
      ) l ON l.tenant_id = tn.id
    ) END
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Supabase grants EXECUTE to anon/authenticated through default privileges, so
-- revoking from PUBLIC alone is not enough.
REVOKE ALL ON FUNCTION public.get_analytics(uuid, timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_analytics(uuid, timestamptz, timestamptz) TO authenticated;
