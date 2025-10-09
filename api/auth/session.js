// API Route: /api/auth/session.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

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

    // Verificar sesión en la base de datos
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_user:admin_users(
          *,
          tenant:tenants(*)
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Retornar información de la sesión
    const response = {
      admin: {
        id: session.admin_user.id,
        email: session.admin_user.email,
        full_name: session.admin_user.full_name,
        role: session.admin_user.role,
        last_login: session.admin_user.last_login
      },
      tenant: session.admin_user.tenant,
      sessionToken
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Session verification error', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}