/**
 * Email Service
 *
 * Servicio centralizado para envío de emails
 * Soporta múltiples proveedores: SendGrid, Resend, Nodemailer
 *
 * Para activar:
 * 1. Instalar: npm install @sendgrid/mail  O  npm install resend
 * 2. Configurar env: SENDGRID_API_KEY  O  RESEND_API_KEY
 * 3. Descomentar el provider que uses
 */

const logger = require('../utils/logger');

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'sendgrid', 'resend', 'console'
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tappmesa.com';
const FROM_NAME = process.env.FROM_NAME || 'TappMesa';

/**
 * SendGrid Provider (descomentar para usar)
 */
/*
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendViaSendGrid(to, subject, html, text) {
  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    subject,
    text: text || stripHtml(html),
    html
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    logger.error('SendGrid error', error);
    return { success: false, error: error.message };
  }
}
*/

/**
 * Resend Provider (descomentar para usar)
 */
/*
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendViaResend(to, subject, html, text) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html)
    });
    return { success: true, data: result };
  } catch (error) {
    logger.error('Resend error', error);
    return { success: false, error: error.message };
  }
}
*/

/**
 * Console Provider (para desarrollo)
 * Imprime el email en consola en lugar de enviarlo
 */
function sendViaConsole(to, subject, html, text) {
  logger.dev('📧 EMAIL (Console Mode):', {
    to,
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    subject,
    text: text || stripHtml(html),
    html: html.substring(0, 200) + '...'
  });

  // En desarrollo, también guardar en archivo temporal
  if (process.env.NODE_ENV === 'development') {
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `email-${timestamp}.html`;
    const filepath = path.join(__dirname, '../../.temp-emails', filename);

    try {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
      fs.writeFileSync(filepath, `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body>
  <div style="background: #f5f5f5; padding: 20px;">
    <div style="background: white; padding: 20px; max-width: 600px; margin: 0 auto;">
      <h2>To: ${to}</h2>
      <h3>Subject: ${subject}</h3>
      <hr/>
      ${html}
    </div>
  </div>
</body>
</html>
      `);
      logger.dev(`📧 Email saved to: ${filepath}`);
    } catch (error) {
      logger.error('Error saving email file', error);
    }
  }

  return { success: true };
}

/**
 * Helper: Strip HTML tags
 */
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Main send function
 */
async function sendEmail(to, subject, html, text = null) {
  // Validaciones
  if (!to || !subject || !html) {
    return { success: false, error: 'Missing required fields' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return { success: false, error: 'Invalid email address' };
  }

  // Seleccionar provider
  switch (EMAIL_PROVIDER) {
    case 'sendgrid':
      // return await sendViaSendGrid(to, subject, html, text);
      logger.warn('SendGrid not configured, using console');
      return sendViaConsole(to, subject, html, text);

    case 'resend':
      // return await sendViaResend(to, subject, html, text);
      logger.warn('Resend not configured, using console');
      return sendViaConsole(to, subject, html, text);

    case 'console':
    default:
      return sendViaConsole(to, subject, html, text);
  }
}

/**
 * Template: Password Reset Email
 */
function getPasswordResetEmail(userName, resetUrl, expiresInMinutes = 60) {
  const subject = 'Restablece tu contraseña - TappMesa';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🔐 Restablece tu Contraseña</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${userName}</strong>,</p>

        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en TappMesa.</p>

        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>

        <p style="font-size: 14px; color: #666;">
          O copia y pega este enlace en tu navegador:<br/>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>

        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            ⚠️ Este enlace expira en <strong>${expiresInMinutes} minutos</strong>.
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} TappMesa. Todos los derechos reservados.<br/>
          Este es un correo automático, por favor no respondas.
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

/**
 * Template: Welcome Email
 */
function getWelcomeEmail(userName, restaurantName, loginUrl) {
  const subject = `¡Bienvenido a TappMesa, ${userName}! 🎉`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 ¡Bienvenido a TappMesa!</h1>
      </div>

      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Hola <strong>${userName}</strong>,</p>

        <p>¡Felicidades! Has registrado exitosamente <strong>${restaurantName}</strong> en TappMesa.</p>

        <h3 style="color: #667eea;">✨ Qué puedes hacer ahora:</h3>

        <ul style="line-height: 2;">
          <li>📋 Crear tu menú digital</li>
          <li>🪑 Configurar tus mesas</li>
          <li>📱 Generar códigos QR</li>
          <li>📊 Ver estadísticas en tiempo real</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}"
             style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Ir al Panel de Administración
          </a>
        </div>

        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            🎁 <strong>Período de prueba:</strong> Tienes 60 días gratis para probar todas las funcionalidades.
          </p>
        </div>

        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

        <p style="font-size: 12px; color: #999; text-align: center;">
          © ${new Date().getFullYear()} TappMesa. Todos los derechos reservados.
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

module.exports = {
  sendEmail,
  getPasswordResetEmail,
  getWelcomeEmail,
  EMAIL_PROVIDER
};
