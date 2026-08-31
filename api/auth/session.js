// API Route: /api/auth/session.js
//
// GET /api/auth/session — restaura la sesión y entrega el JWT inline
// (SEC-002: { session, token } en un solo round-trip; WARNING-1: el token
// incluye `expires_at` en unix epoch seconds, idéntico a claims.exp).
//
// Degradación controlada: si SUPABASE_JWT_SECRET no está configurado
// (deploy previo a split 1) la sesión funciona sin token — nunca 500.
//
// Factory `createSessionHandler({ supabase })` para tests; el default
// export usa el client service-role de módulo (patrón de las otras rutas).

const { createClient } = require('@supabase/supabase-js');
const logger = require('../../lib/utils/logger');
const { resolveClaims } = require('../../lib/middleware/requireAuth');
const { mintAdminJwt, decodeClaims } = require('../../lib/utils/jwt');

function createSessionHandler({ supabase }) {
  return async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');

      if (!sessionToken) {
        return res.status(401).json({ error: 'No session token provided' });
      }

      // Verificar sesión en la base de datos (claims compartidos con requireAuth)
      const session = await resolveClaims(supabase, sessionToken);

      if (!session) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      // Minta el JWT inline (task 1.4). Si SUPABASE_JWT_SECRET aún no está
      // configurado (deploy previo a split 1), la sesión sigue funcionando
      // sin token: degradación controlada, nunca 500.
      let token = null;
      let expires_at = null;
      try {
        token = mintAdminJwt(session);
        expires_at = decodeClaims(token).exp; // unix epoch seconds (SEC-001/002)
      } catch (error) {
        logger.warn('jwt_skipped_missing_secret', { message: error.message });
      }

      // Retornar información de la sesión
      const response = {
        admin: {
          id: session.admin.id,
          email: session.admin.email,
          full_name: session.admin.full_name,
          role: session.admin.role,
          last_login: session.admin.last_login
        },
        tenant: session.tenant,
        sessionToken,
        token,
        expires_at
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Session verification error', error);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  };
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createSessionHandler({ supabase });
module.exports.createSessionHandler = createSessionHandler;