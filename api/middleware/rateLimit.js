/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiter for serverless functions
 * Para producción, se recomienda usar Redis (Upstash) o Vercel Rate Limiting
 */

const logger = require('../utils/logger');

// Store en memoria (se resetea en cada deploy en serverless)
// Para producción: usar Redis/Upstash
const requestStore = new Map();

// Configuración por endpoint
const RATE_LIMITS = {
  'auth/signin': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5, // 5 intentos
    message: 'Demasiados intentos de inicio de sesión. Por favor intenta en 15 minutos.'
  },
  'auth/signup': {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3, // 3 registros por hora
    message: 'Demasiados intentos de registro. Por favor intenta en 1 hora.'
  },
  'auth/reset-password/request': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 3, // 3 intentos
    message: 'Demasiadas solicitudes de reset. Por favor intenta en 15 minutos.'
  },
  'default': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.'
  }
};

/**
 * Obtener IP del cliente
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Limpiar entradas antiguas del store
 */
function cleanupStore() {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    if (now > data.resetTime) {
      requestStore.delete(key);
    }
  }
}

/**
 * Rate limiter middleware
 *
 * @param {string} endpoint - Nombre del endpoint (ej: 'auth/signin')
 * @returns {Function} Middleware function
 */
function rateLimiter(endpoint = 'default') {
  return function(req, res) {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const ip = getClientIp(req);
    const key = `${endpoint}:${ip}`;
    const now = Date.now();

    // Limpiar store periódicamente (cada 100 requests)
    if (Math.random() < 0.01) {
      cleanupStore();
    }

    // Obtener o crear entrada en el store
    let requestData = requestStore.get(key);

    if (!requestData || now > requestData.resetTime) {
      // Primera request o ventana expirada
      requestData = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequestTime: now
      };
      requestStore.set(key, requestData);

      // Headers informativos
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

      return false; // No bloqueado
    }

    // Incrementar contador
    requestData.count++;

    // Headers informativos
    const remaining = Math.max(0, config.maxRequests - requestData.count);
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    // Verificar si excede el límite
    if (requestData.count > config.maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);

      // Log de seguridad
      logger.security('rate_limit_exceeded', {
        endpoint,
        ip,
        count: requestData.count,
        limit: config.maxRequests
      });

      res.status(429).json({
        error: config.message,
        retryAfter: retryAfter,
        limit: config.maxRequests
      });

      return true; // Bloqueado
    }

    return false; // No bloqueado
  };
}

/**
 * Helper para verificar si una IP está en lista negra
 * (Para implementar en el futuro con una DB)
 */
function isBlacklisted(ip) {
  // TODO: Implementar verificación contra base de datos
  const BLACKLISTED_IPS = process.env.BLACKLISTED_IPS?.split(',') || [];
  return BLACKLISTED_IPS.includes(ip);
}

/**
 * Middleware de lista negra
 */
function blacklistMiddleware(req, res) {
  const ip = getClientIp(req);

  if (isBlacklisted(ip)) {
    logger.security('blacklisted_ip_attempt', { ip });
    res.status(403).json({
      error: 'Acceso denegado'
    });
    return true; // Bloqueado
  }

  return false; // No bloqueado
}

/**
 * Resetear límite para una IP específica (útil para testing)
 */
function resetLimit(endpoint, ip) {
  const key = `${endpoint}:${ip}`;
  requestStore.delete(key);
}

/**
 * Obtener estadísticas de rate limiting
 */
function getStats() {
  const stats = {
    totalKeys: requestStore.size,
    endpoints: {}
  };

  for (const [key, data] of requestStore.entries()) {
    const [endpoint] = key.split(':');
    if (!stats.endpoints[endpoint]) {
      stats.endpoints[endpoint] = { count: 0, requests: 0 };
    }
    stats.endpoints[endpoint].count++;
    stats.endpoints[endpoint].requests += data.count;
  }

  return stats;
}

module.exports = {
  rateLimiter,
  blacklistMiddleware,
  getClientIp,
  resetLimit,
  getStats,
  RATE_LIMITS
};
