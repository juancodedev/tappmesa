/**
 * Rate Limiting Middleware
 *
 * Uses Vercel KV (Redis) when available (production/preview).
 * Falls back to in-memory Map for local development.
 *
 * Para configurar Vercel KV en producción:
 *   1. vercel kv create
 *   2. Agregar KV_REST_API_URL y KV_REST_API_TOKEN a las env vars
 *
 * Sin KV configurado, funciona con memoria local (válido para dev).
 */

const logger = require('../utils/logger');

// ============================================================
// Storage backend: Vercel KV con fallback a Map
// ============================================================
let kv = null;
let memoryStore = null;

try {
  const vercelKv = require('@vercel/kv');
  // Solo usar KV si hay URL configurada (evita errores sin env vars)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = vercelKv.kv;
  } else {
    memoryStore = new Map();
  }
} catch {
  memoryStore = new Map();
}

// ============================================================
// Configuración por endpoint
// ============================================================
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
  'auth/token': {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 30, // 30 mint/refresh por ventana
    message: 'Demasiadas solicitudes de token. Por favor intenta más tarde.'
  },
  'default': {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 requests por minuto
    message: 'Demasiadas solicitudes. Por favor intenta más tarde.'
  }
};

// ============================================================
// Helpers
// ============================================================

const KV_PREFIX = 'ratelimit:';

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function buildKey(endpoint, ip) {
  return `${KV_PREFIX}${endpoint}:${ip}`;
}

function getWindowSeconds(windowMs) {
  return Math.ceil(windowMs / 1000);
}

// ============================================================
// KV storage operations
// ============================================================

async function kvIncrement(key, windowMs) {
  // Usar incr para atomicidad, con expire en el primer set
  const count = await kv.incr(key);
  if (count === 1) {
    // Primera request en esta ventana — setear TTL
    await kv.expire(key, getWindowSeconds(windowMs));
  }
  return count;
}

// ============================================================
// Memory storage operations (fallback local)
// ============================================================

function memoryGet(key) {
  return memoryStore.get(key);
}

function memorySet(key, data) {
  memoryStore.set(key, data);
}

function memoryCleanup() {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (now > data.resetTime) {
      memoryStore.delete(key);
    }
  }
}

// ============================================================
// Rate limiter middleware
// ============================================================

function setRateLimitHeaders(res, config, remaining, resetTime) {
  res.setHeader('X-RateLimit-Limit', config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, remaining));
  res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
}

function sendRateLimitResponse(res, config, retryAfter) {
  res.setHeader('Retry-After', retryAfter);
  res.status(429).json({
    error: config.message,
    retryAfter: retryAfter,
    limit: config.maxRequests
  });
}

/**
 * Rate limiter middleware
 *
 * @param {string} endpoint - Nombre del endpoint (ej: 'auth/signin')
 * @returns {Function} Middleware function (async)
 */
function rateLimiter(endpoint = 'default') {
  return async function(req, res) {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default;
    const ip = getClientIp(req);
    const key = buildKey(endpoint, ip);
    const now = Date.now();

    if (kv) {
      // ---- Vercel KV backend ----
      const count = await kvIncrement(key, config.windowMs);
      const remaining = config.maxRequests - count;

      setRateLimitHeaders(res, config, remaining, now + config.windowMs);

      if (count > config.maxRequests) {
        logger.security('rate_limit_exceeded', {
          endpoint, ip, count, limit: config.maxRequests, storage: 'kv'
        });
        sendRateLimitResponse(res, config, getWindowSeconds(config.windowMs));
        return true; // Bloqueado
      }

      return false; // No bloqueado

    } else {
      // ---- Memory backend (fallback local) ----
      // Cleanup periódico
      if (Math.random() < 0.01) {
        memoryCleanup();
      }

      let data = memoryGet(key);

      if (!data || now > data.resetTime) {
        data = {
          count: 1,
          resetTime: now + config.windowMs,
          firstRequestTime: now
        };
        memorySet(key, data);

        setRateLimitHeaders(res, config, config.maxRequests - 1, data.resetTime);
        return false;
      }

      data.count++;
      const remaining = config.maxRequests - data.count;
      setRateLimitHeaders(res, config, remaining, data.resetTime);

      if (data.count > config.maxRequests) {
        const retryAfter = Math.ceil((data.resetTime - now) / 1000);
        logger.security('rate_limit_exceeded', {
          endpoint, ip, count: data.count, limit: config.maxRequests, storage: 'memory'
        });
        sendRateLimitResponse(res, config, retryAfter);
        return true;
      }

      return false;
    }
  };
}

// ============================================================
// Blacklist
// ============================================================

function isBlacklisted(ip) {
  const BLACKLISTED_IPS = process.env.BLACKLISTED_IPS?.split(',') || [];
  return BLACKLISTED_IPS.includes(ip);
}

function blacklistMiddleware(req, res) {
  const ip = getClientIp(req);
  if (isBlacklisted(ip)) {
    logger.security('blacklisted_ip_attempt', { ip });
    res.status(403).json({ error: 'Acceso denegado' });
    return true;
  }
  return false;
}

// ============================================================
// Utils
// ============================================================

async function resetLimit(endpoint, ip) {
  const key = buildKey(endpoint, ip);
  if (kv) {
    await kv.del(key);
  } else {
    memoryStore.delete(key);
  }
}

function getStats() {
  if (kv) {
    return { storage: 'kv', note: 'Stats no disponibles en KV (distribuido)' };
  }

  const stats = {
    storage: 'memory',
    totalKeys: memoryStore.size,
    endpoints: {}
  };

  for (const [key, data] of memoryStore.entries()) {
    const ep = key.replace(KV_PREFIX, '').split(':')[0];
    if (!stats.endpoints[ep]) {
      stats.endpoints[ep] = { count: 0, requests: 0 };
    }
    stats.endpoints[ep].count++;
    stats.endpoints[ep].requests += data.count;
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
