// capability.js
// Utilidades para capability tokens (D4/D5) y números de orden (1.1/1.2).
//
// * Capability token: opaque HMAC-SHA256 sobre un payload JSON, formato
//   versionado `v1.cap.<base64url(payload)>.<hmac-hex>`. Es la credencial
//   de handle de sesión: se guarda en table_sessions.capability_token
//   (único) y se entrega al cliente en el QR. Nunca se publica un uuid.
//
// * Número de orden: `YYMMDD-XXXXXX` (XXXXXX = A-Z0-9), generado con
//   CSPRNG vía rng inyectable (para tests deterministas). El call-site
//   reintenta hasta 3 veces si el número ya existe (unique index).
//
// Node-side: la función SQL `tappmesa_place_order` implementa la misma
// lógica server-side; este módulo sólo cubre la generación/verificación
// local (demo/dev y tests).
//
// CommonJS (WARNING-4, JD round 1): alineado con el resto del árbol server
// (api/*.js usan require/module.exports; package.json no declara
// type:module). El formato anterior (ESM puro) rompía `require()` en
// runtimes Node < 20.19 (ERR_REQUIRE_ESM) y convivía con una segunda forma
// de minting en table-sessions.js → drift de docs. Export object literral
// para que el lexer de Node (cjs-module-lexer) resuelva los named exports.

const { createHmac, timingSafeEqual, randomBytes } = require('node:crypto')

const CAPABILITY_VERSION = 'v1'
const CAPABILITY_KIND = 'cap'
const ORDER_CODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const ORDER_CODE_LENGTH = 6
const MAX_ORDER_NUMBER_ATTEMPTS = 3

/**
 * Genera bytes aleatorios como hex (CSPRNG).
 * @param {number} bytes
 * @returns {string} hex de longitud `bytes * 2`
 */
function randomHex(bytes) {
  return randomBytes(bytes).toString('hex')
}

/**
 * Formatea un número de orden: `YYMMDD-XXXXXX`.
 * @param {Date} date
 * @param {string} code seis caracteres A-Z0-9
 * @returns {string}
 */
function formatOrderNumber(date, code) {
  const y = String(date.getFullYear()).slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}-${code}`
}

/**
 * Elige un código de 6 chars A-Z0-9 usando el rng inyectado.
 * @param {(index: number) => number} rng
 * @returns {string}
 */
function pickOrderCode(rng) {
  let code = ''
  for (let i = 0; i < ORDER_CODE_LENGTH; i += 1) {
    code += ORDER_CODE_ALPHABET[rng(i) % ORDER_CODE_ALPHABET.length]
  }
  return code
}

/**
 * Genera un número de orden único, reintentando hasta 3 veces si colisiona.
 * @param {Date} date
 * @param {(index: number) => number} [rng] inyectable para tests; default CSPRNG
 * @param {Set<string>} [used] números ya existentes (para simular el unique index)
 * @returns {string}
 * @throws {Error} si tras 3 intentos no hay código sin colisión
 */
function generateOrderNumber(date, rng, used = new Set()) {
  for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    const code = rng
      ? pickOrderCode(rng)
      : pickOrderCode(() => randomBytes(1)[0])
    const number = formatOrderNumber(date, code)
    if (!used.has(number)) return number
  }
  throw new Error('could not generate a unique order number after 3 attempts')
}

/**
 * Firma un payload con HMAC-SHA256 y devuelve el token versionado.
 * @param {Record<string, unknown>} payload
 * @param {string} secret
 * @returns {string} `v1.cap.<base64url(payload)>.<hmac-hex>`
 */
function generateCapabilityToken(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const hmac = createHmac('sha256', secret).update(`${CAPABILITY_VERSION}.cap.${encoded}`).digest('hex')
  return `${CAPABILITY_VERSION}.cap.${encoded}.${hmac}`
}

/**
 * Verifica un capability token con comparación en tiempo constante.
 * @param {string} token
 * @param {string} secret
 * @returns {Record<string, unknown> | null} payload firmado, o null si inválido
 */
function verifyCapabilityToken(token, secret) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [version, kind, encoded, hmacHex] = parts
  if (version !== CAPABILITY_VERSION || kind !== CAPABILITY_KIND) return null
  if (!/^[0-9a-f]{64}$/.test(hmacHex)) return null

  const expected = createHmac('sha256', secret)
    .update(`${version}.${kind}.${encoded}`)
    .digest()
  const provided = Buffer.from(hmacHex, 'hex')
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    return null
  }

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

module.exports = {
  randomHex,
  formatOrderNumber,
  generateOrderNumber,
  generateCapabilityToken,
  verifyCapabilityToken,
  // Mantiene la firma del default branch para compatibilidad:
  CAPABILITY_VERSION,
  CAPABILITY_KIND,
  ORDER_CODE_LENGTH,
}