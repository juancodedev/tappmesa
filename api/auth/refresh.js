// API Route: /api/auth/refresh.js
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { corsMiddleware } = require('../middleware/cors');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // CORS
  if (corsMiddleware(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Buscar la sesión por refresh_token
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admin_users(*, tenants(*))')
      .eq('refresh_token', refreshToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Generar nuevo access token
    const newAccessToken = generateToken();
    const newRefreshToken = generateToken(); // Rotación de refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Actualizar la sesión actual con nuevos tokens
    const { error: updateError } = await supabase
      .from('admin_sessions')
      .update({
        session_token: newAccessToken,
        refresh_token: newRefreshToken,
        expires_at: expiresAt.toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      throw updateError;
    }

    res.status(200).json({
      success: true,
      sessionToken: newAccessToken,
      refreshToken: newRefreshToken,
      admin: {
        id: session.admin_users.id,
        email: session.admin_users.email,
        full_name: session.admin_users.full_name,
        role: session.admin_users.role
      },
      tenant: session.admin_users.tenants
    });

  } catch (error) {
    logger.error('Refresh token error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
