// api/table-sessions.js
//
// Plano público de sesión de mesa (task 1.8, spec RTE-004). Cero acceso
// anónimo a la tabla: la verificación de `tables` y el resume/creación de
// `table_sessions` ocurren AQUÍ, server-side, con service-role.
//
//   POST /api/table-sessions   body {table_id, tenant_id}
//     → verifica la fila de `tables` (tenant match, is_active, QR no expirado)
//     → resume la sesión activa o INSERT una nueva
//     → 200 {session, resumed} | 201 {session} | 400 | 429 | 405 | 500
//
// `capability_token`: `ts_` + base64url(HMAC-SHA256(session_uuid,
// SUPABASE_JWT_SECRET, tag "tappmesa-capability-v1")) — opaco, one-way,
// único (unique index), nunca publicado por anon (D4/RTE-004). El lookup de
// órdenes (api/orders.js) lo usa por igualdad: no se decodifica jamás.
//
// SEC-001: flujo de cliente — NO se mintan JWTs acá.
//
// Factory `createTableSessionsHandler({ supabase })` para tests; el default
// export usa el client service-role de módulo.

const { createClient } = require('@supabase/supabase-js');
const { createHmac, randomUUID, timingSafeEqual } = require('node:crypto');
const { corsMiddleware } = require('./middleware/cors');
const { rateLimiter, blacklistMiddleware } = require('./middleware/rateLimit');
const logger = require('./utils/logger');

const CAPABILITY_TAG = 'tappmesa-capability-v1';

function getSecret() {
  return process.env.SUPABASE_JWT_SECRET;
}

// `ts_` + base64url(HMAC-SHA256(session_uuid, SUPABASE_JWT_SECRET, tag)) (RTE-004)
function mintCapabilityToken(sessionId, secret) {
  const s = secret || getSecret();
  if (!s) throw new Error('SUPABASE_JWT_SECRET no configurado');
  const hmac = createHmac('sha256', s)
    .update(`${CAPABILITY_TAG}:${sessionId}`)
    .digest();
  return `ts_${hmac.toString('base64url')}`;
}

// Re-computa el HMAC y compara en tiempo constante contra el token recibido.
function verifyCapabilityToken(capability, sessionId) {
  const secret = getSecret();
  if (!secret || !capability || !capability.startsWith('ts_')) return false;
  const expected = mintCapabilityToken(sessionId);
  const a = Buffer.from(capability);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isUuidLike(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isTableUsable(table) {
  if (!table) return { ok: false, code: 'TABLE_NOT_FOUND' };
  if (table.is_active === false) return { ok: false, code: 'TABLE_NOT_FOUND' };
  if (table.qr_code_expires_at) {
    const expiresAt = new Date(table.qr_code_expires_at);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return { ok: false, code: 'TABLE_QR_EXPIRED' };
    }
  }
  return { ok: true };
}

function makeSessionCode(table) {
  const base = table.unique_code || table.number || 'TBL';
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}

// ---------------------------------------------------------------------
// Factory (tests) + default export
// ---------------------------------------------------------------------

function createTableSessionsHandler({ supabase, jwtSecret } = {}) {
  const fallbackSecret = process.env.SUPABASE_JWT_SECRET;
  const effectiveSecret = jwtSecret || fallbackSecret;

  return async function tableSessionsHandler(req, res) {
    if (corsMiddleware(req, res, ['POST', 'OPTIONS'])) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    if (blacklistMiddleware(req, res)) return;
    if (await rateLimiter('table-sessions')(req, res)) return;

    const body = req.body || {};
    const tableId = body.table_id;
    const tenantId = body.tenant_id;

    if (!isUuidLike(tableId) || !isUuidLike(tenantId)) {
      return res.status(400).json({ error: 'table_id y tenant_id (uuid) son requeridos' });
    }

    try {
      // Verificación server-side de la fila de `tables` (tenant match).
      const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('id, tenant_id, number, unique_code, is_active, qr_code_expires_at')
        .eq('id', tableId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (tableError) {
        if (/PGRST116/.test(tableError.message || '')) {
          return res.status(400).json({ error: 'Mesa no encontrada' });
        }
        logger.error('tables lookup error', tableError);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      const usable = isTableUsable(table);
      if (!usable.ok) {
        return res.status(400).json({
          error:
            usable.code === 'TABLE_QR_EXPIRED'
              ? 'El código QR de esta mesa ha expirado. Por favor, solicita un código nuevo al personal.'
              : 'Mesa no encontrada',
        });
      }

      // Resume: sesión activa más reciente de esta mesa.
      const { data: existing } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('table_id', tableId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return res.status(200).json({ session: existing, resumed: true });
      }

      // Create: el session uuid se genera acá (HMAC del propio uuid; RTE-004),
      // con session_code y capability_token generados server-side en una sola
      // operación atómica.
      const sessionId = randomUUID();
      const sessionCode = makeSessionCode(table);
      const capabilityToken = mintCapabilityToken(sessionId, effectiveSecret);

      const { data: created, error: insertError } = await supabase
        .from('table_sessions')
        .insert({
          id: sessionId,
          tenant_id: tenantId,
          table_id: tableId,
          session_code: sessionCode,
          status: 'active',
          capability_token: capabilityToken,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('table_sessions insert error', insertError);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      return res.status(201).json({ session: created });
    } catch (error) {
      logger.error('table-sessions handler error', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createTableSessionsHandler({ supabase });
module.exports.createTableSessionsHandler = createTableSessionsHandler;
module.exports.mintCapabilityToken = mintCapabilityToken;
module.exports.verifyCapabilityToken = verifyCapabilityToken;