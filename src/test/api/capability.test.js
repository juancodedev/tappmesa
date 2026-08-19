import { describe, it, expect } from 'vitest'
import {
  generateCapabilityToken,
  verifyCapabilityToken,
  generateOrderNumber,
  formatOrderNumber,
  randomHex,
} from '../../../api/utils/capability.js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const modulePath = join(dirname(fileURLToPath(import.meta.url)), '../../../api/utils/capability.js')
const source = readFileSync(modulePath, 'utf8')

const SECRET = 'test-secret-123'

describe('randomHex', () => {
  it('generates a hex string of the requested byte length', () => {
    const hex = randomHex(32)
    expect(hex).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates different values on consecutive calls', () => {
    expect(randomHex(16)).not.toBe(randomHex(16))
  })
})

describe('formatOrderNumber', () => {
  it('formats YYMMDD prefix plus uppercase code', () => {
    const date = new Date(2026, 7, 19) // 2026-08-19
    expect(formatOrderNumber(date, 'ABC123')).toBe('260819-ABC123')
  })

  it('zero-pads the month and day', () => {
    const date = new Date(2026, 0, 5) // 2026-01-05
    expect(formatOrderNumber(date, 'X1Y2Z3')).toBe('260105-X1Y2Z3')
  })
})

describe('generateOrderNumber', () => {
  it('returns YYMMDD-XXXXXX using the provided rng code', () => {
    // alfabeto A-Z0-9 → índices: H A S H 1 A = 7,0,18,7,27,0
    const rng = (i) => [7, 0, 18, 7, 27, 0][i]
    const date = new Date(2026, 7, 19)
    const number = generateOrderNumber(date, rng)
    expect(number).toBe('260819-HASH1A')
  })

  it('retries when the generated code collides with an existing order number', () => {
    const codes = [
      [0, 1, 2, 27, 28, 29], // 'ABC123' (colisiona)
      [17, 14, 1, 14, 19, 29], // 'ROBOT3'
    ]
    let attempts = 0
    const rng = (i) => {
      if (i === 0) attempts += 1
      return codes[Math.min(attempts - 1, codes.length - 1)][i]
    }
    const used = new Set(['260819-ABC123'])

    const number = generateOrderNumber(new Date(2026, 7, 19), rng, used)
    expect(number).toBe('260819-ROBOT3')
    // primer candidato colisionó, segundo tuvo éxito
    expect(attempts).toBe(2)
  })

  it('throws after three colliding attempts', () => {
    let attempts = 0
    const rng = (i) => {
      if (i === 0) attempts += 1
      return [0, 1, 2, 27, 28, 29][i] // 'ABC123' siempre
    }
    const used = new Set(['260819-ABC123'])

    expect(() => generateOrderNumber(new Date(2026, 7, 19), rng, used)).toThrow(
      'unique order number',
    )
    expect(attempts).toBe(3)
  })

  it('defaults to a date-based rng-free call producing a valid format', () => {
    const number = generateOrderNumber(new Date(2026, 7, 19))
    expect(number).toMatch(/^260819-[A-Z0-9]{6}$/)
  })
})

describe('generateCapabilityToken / verifyCapabilityToken', () => {
  it('round-trips a payload', () => {
    const payload = { session: 'sess_123', tenant: 'tenant_456' }
    const token = generateCapabilityToken(payload, SECRET)
    expect(verifyCapabilityToken(token, SECRET)).toEqual(payload)
  })

  it('produces a versioned token', () => {
    const token = generateCapabilityToken({ session: 'sess_1' }, SECRET)
    expect(token).toMatch(/^v1\.cap\./)
  })

  it('returns null for a tampered hmac section', () => {
    const token = generateCapabilityToken({ session: 'sess_1' }, SECRET)
    const parts = token.split('.')
    parts[2] = '0'.repeat(parts[2].length)
    expect(verifyCapabilityToken(parts.join('.'), SECRET)).toBeNull()
  })

  it('returns null for a tampered payload section', () => {
    const token = generateCapabilityToken({ session: 'sess_1' }, SECRET)
    const parts = token.split('.')
    parts[1] = Buffer.from('{"session":"evil"}').toString('base64url')
    expect(verifyCapabilityToken(parts.join('.'), SECRET)).toBeNull()
  })

  it('returns null when signed with a different secret', () => {
    const token = generateCapabilityToken({ session: 'sess_1' }, 'other-secret')
    expect(verifyCapabilityToken(token, SECRET)).toBeNull()
  })

  it('returns null for malformed tokens', () => {
    expect(verifyCapabilityToken('garbage', SECRET)).toBeNull()
    expect(verifyCapabilityToken('v1.cap.only-two-parts', SECRET)).toBeNull()
    expect(verifyCapabilityToken('v9.cap.cGF5bG9hZA==.aaaa', SECRET)).toBeNull()
  })
})

// WARNING-4 (JD round 1): el módulo era ESM puro, incompatible con el runtime
// serverless del repo (commonjs: api/*.js usan require y module.exports). Un
// `require()` real desde Node v20 lanza ERR_REQUIRE_ESM, dejando la utilidad
// inutilizable para rutas de producción. Alineado a CJS: este contrato estático
// fija que el archivo sea CommonJS y exporte la API completa.
describe('capability.js is CommonJS (WARNING-4)', () => {
  it('requires node:crypto via require, not import', () => {
    expect(source).toMatch(/require\(['"]node:crypto['"]\)/)
    expect(source).not.toMatch(/^import\s/m)
  })

  it('uses module.exports with the full API surface', () => {
    expect(source).toMatch(/module\.exports\s*=\s*\{/)
    const exportBlock = source.slice(source.indexOf('module.exports'))
    for (const name of [
      'randomHex',
      'formatOrderNumber',
      'generateOrderNumber',
      'generateCapabilityToken',
      'verifyCapabilityToken',
      'CAPABILITY_VERSION',
      'CAPABILITY_KIND',
      'ORDER_CODE_LENGTH',
    ]) {
      expect(exportBlock).toMatch(new RegExp(`^\\s*${name},?\\s*$`, 'm'))
    }
  })

  it('has no ESM export statements left', () => {
    expect(source).not.toMatch(/export\s+(function|const|class|\{)/)
  })
})