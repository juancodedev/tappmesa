// API Route: /api/auth/signin.js
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../../lib/utils/logger');
const { rateLimiter, blacklistMiddleware } = require('../../lib/middleware/rateLimit');
const { corsMiddleware } = require('../../lib/middleware/cors');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  // CORS
  if (corsMiddleware(req, res, ['POST', 'OPTIONS'])) {
    return; // Preflight handled
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Blacklist check
  if (blacklistMiddleware(req, res)) {
    return; // Blocked
  }

  // Rate limiting
  const rateLimit = rateLimiter('auth/signin');
  if (await rateLimit(req, res)) {
    return; // Rate limit exceeded
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return res.status(401).json({
        error: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Email o contraseña incorrectos'
      });
    }

    // Actualizar último login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Límite de sesiones concurrentes: max 5 por usuario
    const MAX_SESSIONS = parseInt(process.env.MAX_CONCURRENT_SESSIONS) || 5;
    const { data: activeSessions } = await supabase
      .from('admin_sessions')
      .select('id, created_at')
      .eq('user_id', admin.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true });

    if (activeSessions && activeSessions.length >= MAX_SESSIONS) {
      // Eliminar las sesiones más antiguas para dejar lugar a la nueva
      const sessionsToDelete = activeSessions.slice(0, activeSessions.length - MAX_SESSIONS + 1);
      const idsToDelete = sessionsToDelete.map(s => s.id);

      await supabase
        .from('admin_sessions')
        .delete()
        .in('id', idsToDelete);

      logger.security('sessions_limited', {
        user_id: admin.id,
        deleted_count: idsToDelete.length,
        max_sessions: MAX_SESSIONS
      });
    }

    // Crear nueva sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await supabase
      .from('admin_sessions')
      .insert([
        {
          user_id: admin.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        }
      ]);

    // Crear log de auditoría
    await supabase
      .from('admin_audit_logs')
      .insert([
        {
          user_id: admin.id,
          tenant_id: admin.tenant_id,
          action: 'login',
          resource: 'admin_session',
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        }
      ]);

    // Retornar datos sin información sensible
    const response = {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        last_login: admin.last_login
      },
      tenant: admin.tenant,
      sessionToken
    };

    res.status(200).json(response);

  } catch (error) {
    logger.error('Signin error', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

function generateSessionToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}