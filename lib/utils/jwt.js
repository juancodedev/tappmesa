// api/utils/jwt.js
// Emisión/verificación de JWT para sesiones admin (design.md D1).
//
// Claims (HS256 con SUPABASE_JWT_SECRET, que PostgREST/Supabase ya valida):
//   role          = 'authenticated'          → habilita las claim policies (S2)
//   sub           = admin_users.id
//   app_tenant_id = tenant_id del admin (null para super_admin)
//   app_role      = role del admin (tenant_admin | staff | waiter | kitchen | super_admin)
//   app_user_id   = admin_users.id
//   iat / exp     = iat + 3600s
//   iss           = 'tappmesa-api'
//
// El cliente lo guarda en `tappmesa-jwt` y lo adjunta a supabase-js vía
// setAccessToken() (task 1.5). SUPABASE_JWT_SECRET es server-only; jamás
// se expone al bundle del cliente (SEC-007, task 1.12).

const jwt = require('jsonwebtoken');

const JWT_TTL_SECONDS = 3600; // 1 hora
const JWT_ISSUER = 'tappmesa-api';

function getJwtSecret() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SUPABASE_JWT_SECRET is not configured. Set it as a server-only env var (Vercel env, never VITE_).'
    );
  }
  return secret;
}

function signToken(payload, secret, options = {}) {
  return jwt.sign(payload, secret, {
    expiresIn: JWT_TTL_SECONDS,
    issuer: JWT_ISSUER,
    ...options,
  });
}

function verifyToken(token, secret) {
  return jwt.verify(token, secret, { issuer: JWT_ISSUER });
}

// Decodificación SIN verificar la firma (útil para chequear exp client-side).
function decodeClaims(token) {
  return jwt.decode(token);
}

/**
 * Minta el JWT de una sesión admin (task 1.4). No minta nada para flujos
 * de cliente (SEC-001): el objeto `session` debe venir de una sesión admin
 * resuelta por requireAuth (admin_sessions + admin_users).
 * @param {{admin: object, tenant: object|null, sessionToken: string}} session
 * @param {string} [secret]
 * @returns {string} token JWT
 */
function mintAdminJwt({ admin }, secret = getJwtSecret()) {
  const payload = {
    role: 'authenticated',
    sub: admin.id,
    app_tenant_id: admin.tenant_id || null,
    app_role: admin.role,
    app_user_id: admin.id,
  };
  return signToken(payload, secret);
}

module.exports = {
  getJwtSecret,
  signToken,
  verifyToken,
  decodeClaims,
  mintAdminJwt,
  JWT_TTL_SECONDS,
  JWT_ISSUER,
};