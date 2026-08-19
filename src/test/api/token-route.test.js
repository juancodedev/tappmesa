import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { createTokenHandler } from '../../../api/auth/token.js'

const SECRET = 'test-supabase-jwt-secret'
const REAL_SECRET = process.env.SUPABASE_JWT_SECRET

const validSessionRow = {
  id: 'sess-1',
  expires_at: '2099-01-01T00:00:00.000Z',
  admin_user: {
    id: 'admin-uuid-1',
    email: 'admin@test.com',
    full_name: 'Admin',
    role: 'tenant_admin',
    tenant_id: 'tenant-uuid-1',
    is_active: true,
    tenant: { id: 'tenant-uuid-1', name: 'Test Cafe', subdomain: 'test-cafe', slug: 'test-cafe' },
  },
}

function fakeSupabase({ sessionData = validSessionRow, sessionError = null } = {}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          gt: () => ({
            single: async () => ({ data: sessionData, error: sessionError }),
          }),
        }),
      }),
    }),
  }
}

function makeReq({ method = 'POST', headers = {}, body = {} } = {}) {
  return { method, headers, body }
}

function makeRes() {
  const state = { statusCode: 200, body: null, headers: {} }
  return {
    status(code) {
      state.statusCode = code
      return this
    },
    json(data) {
      state.body = data
    },
    setHeader(name, value) {
      state.headers[name] = value
    },
    getHeader(name) {
      return state.headers[name]
    },
    end() {},
    get statusCode() {
      return state.statusCode
    },
    get body() {
      return state.body
    },
  }
}

describe('POST /api/auth/token (task 1.4)', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('mints a verifiable JWT for a valid admin session (200)', async () => {
    const handler = createTokenHandler({ supabase: fakeSupabase() })
    const req = makeReq({ headers: { authorization: 'Bearer session-token-1' } })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBeTruthy()
    expect(res.body.claims.exp).toBeTypeOf('number')

    const decoded = jwt.verify(res.body.token, SECRET, { issuer: 'tappmesa-api' })
    expect(decoded.role).toBe('authenticated')
    expect(decoded.app_tenant_id).toBe('tenant-uuid-1')
    expect(decoded.app_role).toBe('tenant_admin')
    expect(decoded.app_user_id).toBe('admin-uuid-1')
  })

  it('SEC-001: returns expires_at (unix seconds) and the full claim set alongside token', async () => {
    const handler = createTokenHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: { authorization: 'Bearer session-token-1' } }), res)

    expect(res.statusCode).toBe(200)
    // expires_at: unix epoch seconds, idéntico a claims.exp (documentado en la ruta)
    expect(res.body.expires_at).toBeTypeOf('number')
    expect(res.body.expires_at).toBe(res.body.claims.exp)

    const decoded = jwt.verify(res.body.token, SECRET, { issuer: 'tappmesa-api' })
    expect(res.body.claims).toEqual({
      role: decoded.role,
      sub: decoded.sub,
      app_tenant_id: decoded.app_tenant_id,
      app_role: decoded.app_role,
      app_user_id: decoded.app_user_id,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
    })
    expect(decoded.exp - decoded.iat).toBe(3600) // TTL de 60 minutos (SEC-001)
  })

  it('returns 401 without minting when the session is invalid', async () => {
    const handler = createTokenHandler({
      supabase: fakeSupabase({ sessionData: null, sessionError: { message: 'no row' } }),
    })
    const req = makeReq({ headers: { authorization: 'Bearer bogus' } })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const handler = createTokenHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: {} }), res)

    expect(res.statusCode).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  it('returns 405 for non-POST methods', async () => {
    const handler = createTokenHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ method: 'GET' }), res)

    expect(res.statusCode).toBe(405)
  })

  it('returns 500 with a clear error when SUPABASE_JWT_SECRET is missing', async () => {
    delete process.env.SUPABASE_JWT_SECRET
    const handler = createTokenHandler({ supabase: fakeSupabase() })
    const req = makeReq({ headers: { authorization: 'Bearer session-token-1' } })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(500)
    expect(String(res.body.error)).toMatch(/SUPABASE_JWT_SECRET|configurad/)
  })
})