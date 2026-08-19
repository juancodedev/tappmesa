// api/middleware/requireAuth.js
//
// Middleware de autenticación para rutas admin: valida un Bearer
// `tappmesa-session` contra admin_sessions (join admin_users + tenants)
// y adjunta el objeto de claims a req.adminSession.
//
// Exporta además `resolveClaims(client, bearerToken)` (lógica pura y
// testeable con un client inyectado) y `createRequireAuth(supabase)`
// (factory con inyección de dependencias para tests). El default export
// usa el client service-role de módulo, igual que las demás API routes.

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------
// Lógica pura: resuelve una sesión admin → claims
// ---------------------------------------------------------------------
async function resolveClaims(supabase, bearerToken) {
  if (!bearerToken) return null;

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select(
      '*, admin_user:admin_users(*, tenant:tenants(*))'
    )
    .eq('session_token', bearerToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session || !session.admin_user) return null;

  const admin = session.admin_user;
  if (admin.is_active === false) return null;

  return {
    sessionToken: bearerToken,
    admin: {
      id: admin.id,
      email: admin.email,
      full_name: admin.full_name,
      role: admin.role,
      tenant_id: admin.tenant_id,
      last_login: admin.last_login,
    },
    tenant: admin.tenant || null,
  };
}

// ---------------------------------------------------------------------
// Factory: middleware con client inyectable (tests)
// ---------------------------------------------------------------------
function createRequireAuth(supabase) {
  return async function requireAuth(req, res, next) {
    const bearerToken = req.headers?.authorization?.replace('Bearer ', '');

    const claims = await resolveClaims(supabase, bearerToken);
    if (!claims) {
      logger.security('auth_failed', { path: req.url });
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.adminSession = claims;
    return next();
  };
}

// ---------------------------------------------------------------------
// Default export: client service-role de módulo
// ---------------------------------------------------------------------
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createRequireAuth(supabase);
module.exports.createRequireAuth = createRequireAuth;
module.exports.resolveClaims = resolveClaims;