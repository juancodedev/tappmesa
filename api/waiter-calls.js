// api/waiter-calls.js
//
// Customer routes of the call-waiter feature (odd/tasks/call-waiter.md T2).
// No anon database access: the table-session capability authorizes every
// request and the service-role client does the work.
//
//   POST /api/waiter-calls                 → request a waiter {capability, reason?}
//   GET  /api/waiter-calls/current?capability=...
//                                          → latest call of the session (200 {call:null} if unknown)
//   POST /api/waiter-calls/:id/cancel      → cancel own pending call {capability}
//
// The capability travels in the body or the query string, never in a header
// (same contract as /api/orders, SEC-006).
//
// Staff read and resolve calls directly with their claim JWT (RLS policies in
// database/create-waiter-calls.sql); they do not use these routes.
//
// Factory `createWaiterCallsHandler({ supabase })` for tests; the default
// export uses the module-level service-role client.

const { createClient } = require('@supabase/supabase-js');
const { corsMiddleware } = require('../lib/middleware/cors');
const { rateLimiter, blacklistMiddleware } = require('../lib/middleware/rateLimit');
const { findSessionByCapability } = require('../lib/utils/tableSession');
const logger = require('../lib/utils/logger');

const REASONS = ['assistance', 'bill', 'other'];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CALL_COLUMNS =
  'id, tenant_id, table_id, table_session_id, reason, status, created_at, expires_at, resolved_at';

const INTERNAL_ERROR = { error: 'Error interno del servidor' };

function getPathSegments(req) {
  return (req.url || '').split('?')[0].split('/').filter(Boolean); // ['api','waiter-calls',...]
}

function rpcFailure(res, error) {
  const code = error?.message;
  if (code === 'INVALID_REASON') {
    return res.status(400).json({ error: 'Motivo de llamado inválido', code });
  }
  if (code === 'SESSION_NOT_ACTIVE') {
    return res.status(401).json({ error: 'Capability inválida o sesión cerrada', code });
  }
  if (code === 'WAITER_CALLS_DISABLED') {
    return res.status(403).json({ error: 'Este local no tiene habilitado llamar al mesero', code });
  }
  if (code === 'WAITER_CALL_COOLDOWN') {
    const retryAfter = Math.max(1, parseInt(error.details, 10) || 60);
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Espera un momento antes de volver a llamar al mesero',
      code,
      retry_after: retryAfter,
    });
  }
  logger.error('rpc tappmesa_request_waiter_call error', error);
  return res.status(500).json(INTERNAL_ERROR);
}

async function requestCall(supabase, req, res) {
  const reason = req.body?.reason ?? 'assistance';
  if (!REASONS.includes(reason)) {
    return res.status(400).json({ error: 'Motivo de llamado inválido', code: 'INVALID_REASON' });
  }

  const session = await findSessionByCapability(supabase, req.body?.capability || null);
  if (!session) {
    return res.status(401).json({ error: 'Capability inválida o sesión cerrada' });
  }

  const { data, error } = await supabase.rpc('tappmesa_request_waiter_call', {
    p_table_session_id: session.id,
    p_reason: reason,
  });
  if (error) return rpcFailure(res, error);

  // RETURNS SETOF → [call]; normalize to a single object.
  const call = Array.isArray(data) ? data[0] : data;
  if (!call) {
    logger.error('rpc tappmesa_request_waiter_call returned no call', { sessionId: session.id });
    return res.status(500).json(INTERNAL_ERROR);
  }
  return res.status(200).json({ call });
}

async function currentCall(supabase, req, res) {
  const capability = req.query?.capability;
  if (!capability) {
    return res.status(400).json({ error: 'Parámetro capability requerido' });
  }

  const session = await findSessionByCapability(supabase, capability);
  if (!session) {
    return res.status(200).json({ call: null }); // never reveal existence
  }

  const { data, error } = await supabase
    .from('waiter_calls')
    .select(CALL_COLUMNS)
    .eq('table_session_id', session.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('waiter-calls/current db error', error);
    return res.status(500).json(INTERNAL_ERROR);
  }
  if (!data) return res.status(200).json({ call: null });

  // Lazy expiry (S6): staff lists already hide it; persist the flip.
  if (data.status === 'pending' && new Date(data.expires_at).getTime() <= Date.now()) {
    const { error: expireError } = await supabase
      .from('waiter_calls')
      .update({ status: 'expired', resolved_at: data.expires_at })
      .eq('id', data.id)
      .eq('status', 'pending');
    if (expireError) logger.error('waiter-calls expire db error', expireError);
    return res.status(200).json({ call: { ...data, status: 'expired', resolved_at: data.expires_at } });
  }

  return res.status(200).json({ call: data });
}

async function cancelCall(supabase, req, res, callId) {
  const session = await findSessionByCapability(supabase, req.body?.capability || null);
  if (!session) {
    return res.status(401).json({ error: 'Capability inválida o sesión cerrada' });
  }
  if (!UUID_PATTERN.test(callId)) {
    return res.status(200).json({ cancelled: false }); // a malformed id never matches (no 22P02 → 500)
  }

  const { data, error } = await supabase
    .from('waiter_calls')
    .update({ status: 'cancelled' })
    .eq('id', callId)
    .eq('table_session_id', session.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString()) // an expired call is not cancellable (no cooldown)
    .select(CALL_COLUMNS);

  if (error) {
    logger.error('waiter-calls cancel db error', error);
    return res.status(500).json(INTERNAL_ERROR);
  }
  if (!data || data.length === 0) {
    return res.status(200).json({ cancelled: false }); // never reveal existence
  }
  return res.status(200).json({ cancelled: true, call: data[0] });
}

function createWaiterCallsHandler({ supabase }) {
  return async function waiterCallsHandler(req, res) {
    if (corsMiddleware(req, res, ['POST', 'GET', 'OPTIONS'])) return;

    const segments = getPathSegments(req); // ['api','waiter-calls', ...]
    const isCurrent = req.method === 'GET' && segments[2] === 'current';
    const isCancel = req.method === 'POST' && segments[2] !== undefined && segments[3] === 'cancel';
    const isCreate = req.method === 'POST' && segments[2] === undefined;

    if (!isCurrent && !isCancel && !isCreate) {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (blacklistMiddleware(req, res)) return;

    try {
      if (isCurrent) {
        if (await rateLimiter('waiter-calls/current')(req, res)) return;
        return await currentCall(supabase, req, res);
      }
      if (await rateLimiter('waiter-calls')(req, res)) return;
      if (isCancel) return await cancelCall(supabase, req, res, segments[2]);
      return await requestCall(supabase, req, res);
    } catch (error) {
      logger.error('waiter-calls handler error', error);
      return res.status(500).json(INTERNAL_ERROR);
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createWaiterCallsHandler({ supabase });
module.exports.createWaiterCallsHandler = createWaiterCallsHandler;
