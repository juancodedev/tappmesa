// API Route: /api/auth/signout.js
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
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || req.body.sessionToken;

    if (!sessionToken) {
      return res.status(400).json({ error: 'Session token is required' });
    }

    // Obtener información de la sesión antes de eliminarla (para auditoría)
    const { data: session } = await supabase
      .from('admin_sessions')
      .select(`
        user_id,
        admin_user:admin_users(tenant_id)
      `)
      .eq('session_token', sessionToken)
      .single();

    // Eliminar sesión de la base de datos
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      console.error('Error deleting session:', error);
    }

    // Crear log de auditoría si tenemos información de la sesión
    if (session) {
      await supabase
        .from('admin_audit_logs')
        .insert([
          {
            user_id: session.user_id,
            tenant_id: session.admin_user.tenant_id,
            action: 'logout',
            resource: 'admin_session',
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          }
        ]);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}