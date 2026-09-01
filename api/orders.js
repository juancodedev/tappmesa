// api/orders.js
//
// Rutas de órdenes para el flujo de cliente (task 1.7). Cero acceso anónimo
// a la BD: todo pasa por rutas server con service-role y RPC.
//
//   POST /api/orders                     → colocar orden (capability O takeout)
//   GET  /api/orders/my?capability=...   → órdenes de la sesión (200 [] si desconocida)
//   POST /api/orders/:id/cancel          → cancelar (sólo propia; 200 {cancelled:false} si ajena)
//
// Credenciales (SEC-006/R2-5: sin headers custom y la capability viaja en
// body o query string, NUNCA en Authorization):
//   * capability en body (`body.capability`) para place/cancel (spec:
//     {items[], capability?, ...} y {capability}); query ?capability= para /my
//   * takeout: sin capability, tenant desde Host header
//
// SEC-001: este flujo de cliente NUNCA minta JWTs.
//
// Factory `createOrdersHandler({ supabase })` para tests; el default export
// usa el client service-role de módulo.

const { createClient } = require('@supabase/supabase-js');
const { corsMiddleware } = require('../lib/middleware/cors');
const { rateLimiter, blacklistMiddleware } = require('../lib/middleware/rateLimit');
const { resolveSubdomain } = require('../lib/utils/hostResolver');
const logger = require('../lib/utils/logger');

const PLACEABLE_STATUSES = ['pending', 'preparing'];

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function getPathSegments(req) {
  return (req.url || '').split('?')[0].split('/').filter(Boolean); // ['api','orders',...]
}

function foldTemperature(item) {
  const tempNote = item.temperature ? `Temperatura: ${item.temperature}` : '';
  if (!item.notes) return tempNote || null;
  return tempNote ? `${tempNote} | ${item.notes}` : item.notes;
}

// Capacidad → sesión de mesa (único por capability_token). null = inválida.
async function findSessionByCapability(supabase, capability) {
  if (!capability) return null;
  const { data, error } = await supabase
    .from('table_sessions')
    .select('id, tenant_id, status, ended_at')
    .eq('capability_token', capability)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== 'active' || data.ended_at) return null;
  return data;
}

function isValidItems(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.every(
      (it) =>
        it &&
        typeof it.product_id === 'string' &&
        Number.isInteger(it.quantity) &&
        it.quantity >= 1 &&
        it.quantity <= 99,
    )
  );
}

// ---------------------------------------------------------------------
// Handlers de cada endpoint
// ---------------------------------------------------------------------

async function placeOrder(supabase, req, res) {
  // SEC-006: la capability viaja en body (spec {items[], capability?, ...}),
  // NUNCA en Authorization (que no es custom header pero contradice el
  // contrato y el canal query/body exigido por el spec).
  const capability = req.body?.capability || null;
  const body = req.body || {};

  const idempotencyKey = body.idempotency_key;
  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    return res.status(400).json({ error: 'idempotency_key es requerido (replay safety)' });
  }

  if (!isValidItems(body.items)) {
    return res.status(400).json({ error: 'items inválidos: requiere al menos 1 ítem con product_id y quantity 1-99' });
  }

  let tenantId;
  let tableSessionId = null;

  if (capability) {
    const session = await findSessionByCapability(supabase, capability);
    if (!session) {
      return res.status(401).json({ error: 'Capability inválida o sesión cerrada' });
    }
    tenantId = session.tenant_id;
    tableSessionId = session.id;
  } else {
    // Takeout: el tenant se resuelve desde el Host header (R2-5: sin headers custom)
    const subdomain = resolveSubdomain(req.headers?.host);
    if (!subdomain) {
      return res.status(400).json({ error: 'Se requiere capability o un tenant reconocible por Host' });
    }
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .maybeSingle();
    if (error || !tenant) {
      return res.status(400).json({ error: 'Tenant no reconocido' });
    }
    tenantId = tenant.id;
  }

  // Replay-safe: si la orden ya existe para esta idempotency_key, devolver 200.
  // WARNING-3 (JD round 1): el pre-check es TENANT-scoped — una key de otro
  // tenant no debe colisionar/filtrarse como replay (leak cross-tenant).
  const { data: existing } = await supabase
    .from('orders')
    .select('id, tenant_id, order_number, status, subtotal, tax, total')
    .eq('idempotency_key', idempotencyKey)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ order: existing, duplicate: true });
  }

  const items = body.items.map((it) => ({
    product_id: it.product_id,
    quantity: it.quantity,
    notes: foldTemperature(it),
  }));

  const { data: rpcData, error: rpcError } = await supabase.rpc('tappmesa_place_order', {
    p_tenant_id: tenantId,
    p_table_session_id: tableSessionId,
    p_customer_name: body.customer_name || null,
    p_customer_phone: body.customer_phone || null,
    p_items: items,
    p_idempotency_key: idempotencyKey,
  });

  if (rpcError) {
    const msg = rpcError.message || String(rpcError);
    if (/EMPTY_ORDER|INVALID_ITEM|INVALID_QUANTITY/.test(msg)) {
      return res.status(400).json({ error: 'Solicitud inválida' });
    }
    if (/SESSION_CLOSED/.test(msg)) {
      return res.status(409).json({ error: 'La sesión de mesa está cerrada' });
    }
    if (/ORDER_NUMBER_EXHAUSTED/.test(msg)) {
      logger.error('order_number_exhausted', { tenantId });
      return res.status(503).json({ error: 'Reintenta en unos segundos' });
    }
    logger.error('rpc tappmesa_place_order error', rpcError);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  // WARNING-2 (JD round 1): tappmesa_place_order es RETURNS SETOF → el shape
  // de la rpc es {data:[orden]}, mientras el replay del pre-check devuelve
  // objeto único. Normalizar SIEMPRE a objeto único para que el contrato
  // {order, duplicate} sea idéntico en ambos paths (y a cualquier shape que
  // adopte la función en el futuro: SETOF o composite).
  const order = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (!order) {
    logger.error('rpc tappmesa_place_order returned no order', { tenantId, idempotencyKey });
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  return res.status(201).json({ order, duplicate: false });
}

async function myOrders(supabase, req, res) {
  const capability = req.query?.capability;
  if (!capability) {
    return res.status(400).json({ error: 'Parámetro capability requerido' });
  }

  const session = await findSessionByCapability(supabase, capability);
  if (!session) {
    return res.status(200).json({ orders: [] }); // no filtra existencia
  }

  // RTE-002 (CRITICAL-1): la forma embebida `order_items → products` DEBE ser
  // idéntica a la lectura actual de TableOrdersHistory.jsx:31-46 para que el
  // flip de los pollers en split 2 sea drop-in (spec RTE-002 / design D5).
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(id, name, price, image_url))')
    .eq('table_session_id', session.id)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('orders/my db error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  return res.status(200).json({ orders: data || [] });
}

async function cancelOrder(supabase, req, res, orderId) {
  // SEC-006: la capability viaja en body (spec: {capability}).
  const capability = req.body?.capability || null;
  const session = await findSessionByCapability(supabase, capability);
  if (!session) {
    return res.status(401).json({ error: 'Capability inválida o sesión cerrada' });
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('table_session_id', session.id)
    .in('status', PLACEABLE_STATUSES)
    .select();

  if (error) {
    logger.error('orders cancel db error', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  if (!data || data.length === 0) {
    // Orden ajena o no cancelable: nunca revelar existencia (task 1.7)
    return res.status(200).json({ cancelled: false });
  }

  return res.status(200).json({ cancelled: true, order: data[0] });
}

// ---------------------------------------------------------------------
// Factory (tests) + default export
// ---------------------------------------------------------------------

function createOrdersHandler({ supabase }) {
  return async function ordersHandler(req, res) {
    if (corsMiddleware(req, res, ['POST', 'GET', 'OPTIONS'])) return;

    const segments = getPathSegments(req); // ['api','orders', ...]
    const isMy = req.method === 'GET' && segments[2] === 'my';
    const isCancel =
      req.method === 'POST' && segments[2] !== undefined && segments[3] === 'cancel';

    if (!isMy && !isCancel && req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (blacklistMiddleware(req, res)) return;

    try {
      if (isMy) {
        if (await rateLimiter('orders/my')(req, res)) return;
        return await myOrders(supabase, req, res);
      }
      if (isCancel) {
        if (await rateLimiter('orders')(req, res)) return;
        return await cancelOrder(supabase, req, res, segments[2]);
      }
      if (await rateLimiter('orders')(req, res)) return;
      return await placeOrder(supabase, req, res);
    } catch (error) {
      logger.error('orders handler error', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createOrdersHandler({ supabase });
module.exports.createOrdersHandler = createOrdersHandler;