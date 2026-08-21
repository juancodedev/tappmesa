/**
 * CORS Middleware para API Routes
 *
 * Controla qué dominios pueden hacer requests a la API
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://tappmesa.vercel.app',
  'https://tappmesa.com',
  // Permitir subdominios de Vercel (*.vercel.app)
  /https:\/\/.*-tappmesa\.vercel\.app$/,
  // Permitir subdominios de producción (*.tappmesa.com)
  /https:\/\/.*\.tappmesa\.com$/
];

function isOriginAllowed(origin) {
  if (!origin) return false;

  return ALLOWED_ORIGINS.some((allowedOrigin) => {
    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    }
    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }
    return false;
  });
}

/**
 * Middleware de CORS
 * Usar en cada API route
 */
function corsMiddleware(req, res, allowedMethods = ['GET', 'POST', 'OPTIONS']) {
  const origin = req.headers.origin;

  // Si el origin está permitido, agregarlo al header
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    allowedMethods.join(', ')
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true; // Indica que es preflight
  }

  return false; // No es preflight, continuar
}

module.exports = {
  corsMiddleware,
  isOriginAllowed,
  ALLOWED_ORIGINS
};
