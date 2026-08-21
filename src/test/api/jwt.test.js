import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'
import {
  mintAdminJwt,
  verifyToken,
  decodeClaims,
  getJwtSecret,
  JWT_TTL_SECONDS,
  JWT_ISSUER,
} from '../../../lib/utils/jwt.js'

const SECRET = 'test-supabase-jwt-secret'
const REAL_SECRET = process.env.SUPABASE_JWT_SECRET

const adminClaims = {
  admin: { id: 'admin-uuid-1', email: 'admin@test.com', full_name: 'Admin', role: 'tenant_admin', tenant_id: 'tenant-uuid-1' },
  tenant: { id: 'tenant-uuid-1', name: 'Test Cafe', subdomain: 'test-cafe' },
  sessionToken: 'session-token-1',
}

describe('getJwtSecret', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('returns the configured secret', () => {
    expect(getJwtSecret()).toBe(SECRET)
  })

  it('throws a clear error when the secret is missing', () => {
    delete process.env.SUPABASE_JWT_SECRET
    expect(() => getJwtSecret()).toThrow(/SUPABASE_JWT_SECRET/)
  })
})

describe('mintAdminJwt (design D1 claims)', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('mints a JWT with app_* claims and 3600s TTL', () => {
    const token = mintAdminJwt(adminClaims)
    const decoded = jwt.decode(token)

    expect(decoded.role).toBe('authenticated')
    expect(decoded.sub).toBe('admin-uuid-1')
    expect(decoded.app_tenant_id).toBe('tenant-uuid-1')
    expect(decoded.app_role).toBe('tenant_admin')
    expect(decoded.app_user_id).toBe('admin-uuid-1')
    expect(decoded.iss).toBe(JWT_ISSUER)
    expect(decoded.exp - decoded.iat).toBe(JWT_TTL_SECONDS)
  })

  it('sets app_tenant_id null when the admin has no tenant (super_admin)', () => {
    const superAdmin = { admin: { id: 'a-2', role: 'super_admin', tenant_id: null }, tenant: null }
    const decoded = jwt.decode(mintAdminJwt(superAdmin))
    expect(decoded.app_tenant_id).toBeNull()
    expect(decoded.app_role).toBe('super_admin')
  })

  it('produces a token that verifyToken accepts', () => {
    const token = mintAdminJwt(adminClaims)
    const payload = verifyToken(token, SECRET)
    expect(payload.app_user_id).toBe('admin-uuid-1')
  })
})

describe('verifyToken', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('rejects a token signed with a different secret', () => {
    const token = mintAdminJwt(adminClaims)
    expect(() => verifyToken(token, 'other-secret')).toThrow()
  })

  it('rejects a tampered token', () => {
    const token = mintAdminJwt(adminClaims)
    const [h, p, s] = token.split('.')
    const tampered = `${h}.${p}.${'a'.repeat(s.length)}`
    expect(() => verifyToken(tampered, SECRET)).toThrow()
  })

  it('rejects an expired token', () => {
    const token = jwt.sign({ role: 'authenticated', sub: 'x' }, SECRET, {
      expiresIn: -10,
      issuer: JWT_ISSUER,
    })
    expect(() => verifyToken(token, SECRET)).toThrow(/expired/)
  })
})

describe('decodeClaims', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('returns the raw payload without verifying the signature', () => {
    const token = mintAdminJwt(adminClaims)
    const claims = decodeClaims(token)
    expect(claims.app_role).toBe('tenant_admin')
    expect(claims.exp).toBeTypeOf('number')
  })
})