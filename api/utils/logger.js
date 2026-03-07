/**
 * Logger para API Routes (Node.js/Serverless)
 *
 * En desarrollo: Muestra todos los logs
 * En producción: Solo muestra errores y auditoría
 */

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

/**
 * Logger para serverless functions
 */
const logger = {
  /**
   * Logs de desarrollo - NO se muestran en producción
   */
  dev: (...args) => {
    if (isDev) {
      console.log('[DEV]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Logs de información - Solo en desarrollo
   */
  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', new Date().toISOString(), ...args);
    }
  },

  /**
   * Warnings - Se muestran siempre
   */
  warn: (...args) => {
    console.warn('[WARN]', new Date().toISOString(), ...args);
  },

  /**
   * Errores - Se muestran siempre (sin detalles sensibles)
   */
  error: (message, error) => {
    console.error('[ERROR]', new Date().toISOString(), message);
    if (isDev && error) {
      console.error('[ERROR DETAILS]', error);
    }
  },

  /**
   * Errores críticos - Se muestran siempre
   */
  critical: (message, error) => {
    console.error('[CRITICAL]', new Date().toISOString(), message);
    if (error) {
      console.error('[CRITICAL DETAILS]', isDev ? error : error.message);
    }
    // TODO: Integrar con Sentry
  },

  /**
   * Logs de auditoría - SIEMPRE se registran
   * Usar para eventos de seguridad
   */
  audit: (event, userId, details = {}) => {
    console.log('[AUDIT]', new Date().toISOString(), {
      event,
      userId,
      ...details
    });
    // TODO: Enviar a servicio de auditoría externo
  },

  /**
   * Logs de seguridad - SIEMPRE se registran
   * Para intentos de acceso no autorizados, etc.
   */
  security: (event, details = {}) => {
    console.warn('[SECURITY]', new Date().toISOString(), {
      event,
      ...details
    });
    // TODO: Alertar equipo de seguridad
  }
};

module.exports = logger;
