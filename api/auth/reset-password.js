// API Route: /api/auth/reset-password.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../../lib/utils/logger');
const { rateLimiter, blacklistMiddleware } = require('../../lib/middleware/rateLimit');
const { corsMiddleware } = require('../../lib/middleware/cors');
const { sendEmail, getPasswordResetEmail } = require('../../lib/services/emailService');
const { validatePassword } = require('../../lib/middleware/validation');

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Task 1.10 (spec ADM-002): los tokens se generan SERVER-SIDE con
// crypto.randomBytes(32) y se insertan directo en password_reset_tokens.
// Ya no se usa la función pública generate_password_reset_token (SECURITY
// DEFINER): cualquier caller del anon key podía mintar tokens de reset.
// Los tokens previos del usuario se invalidan ANTES de insertar el nuevo.
function createResetPasswordHandler({ supabase }) {
  // Solicitar reset de contraseña
  async function handleResetRequest(req, res) {
    // Rate limiting para reset requests
    const rateLimit = rateLimiter('auth/reset-password/request');
    if (await rateLimit(req, res)) {
      return;
    }

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      // Verificar que el usuario existe
      const { data: user } = await supabase
        .from('admin_users')
        .select('id, full_name')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      // Siempre retornar éxito por seguridad (no revelar si el email existe)
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'Si el email existe, recibirás instrucciones de reset'
        });
      }

      // Token criptográficamente seguro, generado 100% server-side
      const token = crypto.randomBytes(32).toString('hex');

      // Invalidar tokens previos del usuario (evita replay/abuso)
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('user_id', user.id);

      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert([{ user_id: user.id, token, expires_at: expiresAt }]);

      if (insertError) throw insertError;

      // Enviar email con el token de reset
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

      const { subject, html } = getPasswordResetEmail(user.full_name, resetUrl, RESET_TOKEN_TTL_MS / 60000);
      const emailResult = await sendEmail(email, subject, html);

      if (!emailResult.success) {
        logger.error('Failed to send password reset email', emailResult.error);
        // No fallar el request, solo logear el error
      }

      // SEGURIDAD: NO registrar tokens en logs de producción
      logger.audit('password_reset_requested', user.id, {
        email: email.substring(0, 3) + '***', // Email parcialmente ofuscado
        emailSent: emailResult.success
      });

      // Crear log de auditoría
      await supabase
        .from('admin_audit_logs')
        .insert([
          {
            user_id: user.id,
            action: 'password_reset_requested',
            resource: 'admin_user',
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          }
        ]);

      res.status(200).json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones de reset'
      });

    } catch (error) {
      logger.error('Reset request error', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Confirmar token de reset (verificar validez)
  async function handleResetConfirm(req, res) {
    // Rate limiting para confirmaciones (anti fuerza bruta del token)
    const rateLimit = rateLimiter('auth/reset-password/confirm');
    if (await rateLimit(req, res)) {
      return;
    }

    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token es requerido' });
      }

      // Verificar token
      const { data: resetToken, error } = await supabase
        .from('password_reset_tokens')
        .select(`
          *,
          user:admin_users(id, email, full_name)
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !resetToken) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      res.status(200).json({
        success: true,
        user: {
          email: resetToken.user.email,
          full_name: resetToken.user.full_name
        }
      });

    } catch (error) {
      logger.error('Reset confirm error', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Resetear contraseña con token
  async function handleResetPassword(req, res) {
    // Rate limiting para cambios de contraseña
    const rateLimit = rateLimiter('auth/reset-password/reset');
    if (await rateLimit(req, res)) {
      return;
    }

    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      // Verificar token
      const { data: resetToken, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select(`
          *,
          user:admin_users(id, email, tenant_id)
        `)
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (tokenError || !resetToken) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      // Hash de la nueva contraseña
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña del usuario
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({
          password_hash: passwordHash,
          needs_password_reset: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', resetToken.user.id);

      if (updateError) throw updateError;

      // Marcar token como usado
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', resetToken.id);

      // Invalidar todas las sesiones del usuario por seguridad
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('user_id', resetToken.user.id);

      // Crear log de auditoría
      await supabase
        .from('admin_audit_logs')
        .insert([
          {
            user_id: resetToken.user.id,
            tenant_id: resetToken.user.tenant_id,
            action: 'password_reset_completed',
            resource: 'admin_user',
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          }
        ]);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      logger.error('Reset password error', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return async function handler(req, res) {
    // CORS
    if (corsMiddleware(req, res, ['POST', 'OPTIONS'])) {
      return;
    }

    // Blacklist check
    if (blacklistMiddleware(req, res)) {
      return;
    }

    if (req.method === 'POST' && req.url.includes('/request')) {
      return handleResetRequest(req, res);
    }

    if (req.method === 'POST' && req.url.includes('/confirm')) {
      return handleResetConfirm(req, res);
    }

    if (req.method === 'POST') {
      return handleResetPassword(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }
}

const defaultSupabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = createResetPasswordHandler({ supabase: defaultSupabase });
module.exports.createResetPasswordHandler = createResetPasswordHandler;