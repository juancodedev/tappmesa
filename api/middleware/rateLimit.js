const { Redis } = require('@upstash/redis');
const logger = require('../utils/logger');

// Cliente de Redis (Upstash)
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Store en memoria (fallback si no hay Redis)
const requestStore = new Map();

// Configuración por endpoint
const RATE_LIMITS = {
  'auth/signin': {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Demasiados intentos de inicio de sesión. Por favor intenta en 15 minutos.'
  },
  'auth/signup': {
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: 'Demasiados intentos de registro. Por favor intenta en 1 hora.'
  },
  'auth/reset-password/request': {
    windowMs: 15 * 60 * 1000,
    maxRequests: 3,
    message: 'Demasiadas solicitudes de reset. Por favor intenta en 15 minutos.'
  },
  'default': {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.'
  }
};

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
 * Rate limiter middleware (Async para soporte de Redis)
 */
function rateLimiter(endpoint = 'default') {
  return async function(req, res) {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const ip = getClientIp(req);
    const key = `ratelimit:${endpoint}:${ip}`;
    const now = Date.now();

    if (redis) {
      try {
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.pexpire(key, config.windowMs);
        }

        const remaining = Math.max(0, config.maxRequests - count);
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);

        if (count > config.maxRequests) {
          const ttl = await redis.pttl(key);
          const retryAfter = Math.ceil(ttl / 1000);
          res.setHeader('Retry-After', retryAfter);

          logger.security('rate_limit_exceeded', { endpoint, ip, count, limit: config.maxRequests });

          res.status(429).json({
            error: config.message,
            retryAfter,
            limit: config.maxRequests
          });
          return true;
        }
        return false;
      } catch (error) {
        logger.error('Redis Rate Limit Error', error);
        // Fallback a memoria si Redis falla
      }
    }

    // Lógica en memoria (enriquecida)
    let requestData = requestStore.get(key);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 1, resetTime: now + config.windowMs };
      requestStore.set(key, requestData);
    } else {
      requestData.count++;
    }

    const remaining = Math.max(0, config.maxRequests - requestData.count);
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

    if (requestData.count > config.maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({
        error: config.message,
        retryAfter,
        limit: config.maxRequests
      });
      return true;
    }

    return false;
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
