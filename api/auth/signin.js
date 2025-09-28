// API Route: /api/auth/signin.js
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Crear nueva sesión
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 días

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
    console.error('Signin error:', error);
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