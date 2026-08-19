// api/auth/token.js
//
// POST /api/auth/token
// Minta/renueva el JWT de sesión admin (task 1.4, SEC-001).
//
// Body/headers: Authorization: Bearer <tappmesa-session>
// Response 200: { token, claims: { exp } }      → el cliente lo guarda en `tappmesa-jwt`
// Response 401: sesión inválida/expirada (no se minta nada)
// Response 405: método no permitido
// Response 429: rate limit ('auth/token')
//
// Factory `createTokenHandler({ supabase })` para tests; el default export
// usa el client service-role de módulo.

const { createClient } = require('@supabase/supabase-js');
const { createRequireAuth } = require('../middleware/requireAuth');
const { mintAdminJwt, decodeClaims } = require('../utils/jwt');
const { rateLimiter, blacklistMiddleware } = require('../middleware/rateLimit');
const { corsMiddleware } = require('../middleware/cors');
const logger = require('../utils/logger');

function createTokenHandler({ supabase }) {
  const requireAuth = createRequireAuth(supabase);

  return async function tokenHandler(req, res) {
    if (corsMiddleware(req, res, ['POST'])) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (blacklistMiddleware(req, res)) return;
    if (await rateLimiter('auth/token')(req, res)) return;

    try {
      let claims;
      let authorized = false;
      await requireAuth(req, res, () => { authorized = true; });
      if (!authorized) return; // requireAuth ya respondió 401

      claims = req.adminSession;

      const token = mintAdminJwt(claims);
      const decoded = decodeClaims(token);

      logger.info('jwt_minted', {
        user_id: claims.admin.id,
        role: claims.admin.role,
        tenant_id: claims.admin.tenant_id,
      });

      return res.status(200).json({
        token,
        claims: { exp: decoded.exp },
      });
    } catch (error) {
      if (error && /SUPABASE_JWT_SECRET/.test(error.message)) {
        logger.error('jwt_secret_missing', error);
        return res.status(500).json({ error: 'Servidor mal configurado: falta SUPABASE_JWT_SECRET' });
      }
      logger.error('token handler error', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createTokenHandler({ supabase });
module.exports.createTokenHandler = createTokenHandler;