// API Route: /api/auth/session.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { resolveClaims } = require('../middleware/requireAuth');
const { mintAdminJwt } = require('../utils/jwt');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
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
    try {
      token = mintAdminJwt(session);
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
      token
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Session verification error', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}