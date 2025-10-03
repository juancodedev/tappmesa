/**
 * Logger condicional para producción
 *
 * En desarrollo: Muestra todos los logs
 * En producción: Solo muestra errores críticos
 */

import * as Sentry from '@sentry/react';

const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
const isProd = import.meta.env.PROD || import.meta.env.MODE === 'production';

/**
 * Logger personalizado con control de ambiente
 */
export const logger = {
  /**
   * Logs de desarrollo - NO se muestran en producción
   * Usar para debugging y información de desarrollo
   */
  dev: (...args) => {
    if (isDev) {
      console.log('[DEV]', ...args);
    }
  },

  /**
   * Logs de información - Solo en desarrollo
   * Usar para flujo de la aplicación
   */
  info: (...args) => {
    if (isDev) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warnings - Se muestran siempre
   * Usar para situaciones anómalas que no son errores
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Errores - Se muestran siempre
   * Usar para errores que necesitan ser registrados
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);

    // Enviar a Sentry en producción
    if (isProd && args[0] instanceof Error) {
      Sentry.captureException(args[0], {
        level: 'error',
        extra: args.slice(1).reduce((acc, arg, i) => {
          acc[`arg_${i}`] = arg;
          return acc;
        }, {})
      });
    }
  },

  /**
   * Errores críticos - Se muestran siempre + envían a Sentry
   * Usar para errores que requieren atención inmediata
   */
  critical: (...args) => {
    console.error('[CRITICAL]', ...args);

    // Enviar a Sentry siempre (incluso en dev si está configurado)
    const error = args[0] instanceof Error ? args[0] : new Error(args.join(' '));
    Sentry.captureException(error, {
      level: 'fatal',
      extra: args.slice(1).reduce((acc, arg, i) => {
        acc[`arg_${i}`] = arg;
        return acc;
      }, {})
    });
  },

  /**
   * Logs de auditoría - Solo en producción (para tracking de seguridad)
   * Usar para eventos de seguridad importantes
   */
  audit: (event, data) => {
    if (isProd) {
      console.log('[AUDIT]', event, data);
      // TODO: Enviar a servicio de auditoría
    }
  },

  /**
   * Performance logs - Solo en desarrollo
   * Usar para medir tiempos de ejecución
   */
  perf: (label, ...args) => {
    if (isDev) {
      console.log(`[PERF] ${label}`, ...args);
    }
  },

  /**
   * Debug condicional - Solo si DEBUG está habilitado
   */
  debug: (...args) => {
    if (isDev && localStorage.getItem('DEBUG') === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

/**
 * Helper para logs de tabla (solo desarrollo)
 */
export const logTable = (data) => {
  if (isDev) {
    console.table(data);
  }
};

/**
 * Helper para grupos de logs (solo desarrollo)
 */
export const logGroup = (label, callback) => {
  if (isDev) {
    console.group(label);
    callback();
    console.groupEnd();
  }
};

/**
 * Timer para medir performance (solo desarrollo)
 */
export const timer = {
  start: (label) => {
    if (isDev) {
      console.time(label);
    }
  },
  end: (label) => {
    if (isDev) {
      console.timeEnd(label);
    }
  }
};

export default logger;
