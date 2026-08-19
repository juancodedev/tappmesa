import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { createSessionHandler } from '../../../api/auth/session.js'

// Task 1.4 / SEC-002: GET /api/auth/session devuelve { session, token } en un
// solo round-trip. WARNING-1 (verify): el token inline DEBE incluir
// `expires_at` (unix epoch seconds, idéntico a claims.exp) — contrato
// { token, expires_at } estable vs { token } y degradado controlado a null.

const SECRET = 'test-supabase-jwt-secret'
const REAL_SECRET = process.env.SUPABASE_JWT_SECRET

const validSessionData = {
  id: 'sess-1',
  session_token: 'session-token-1',
  expires_at: '2099-01-01T00:00:00.000Z',
  admin_user: {
    id: 'admin-uuid-1',
    email: 'admin@test.com',
    full_name: 'Admin',
    role: 'tenant_admin',
    tenant_id: 'tenant-uuid-1',
    is_active: true,
    last_login: '2026-08-19T10:00:00.000Z',
    tenant: { id: 'tenant-uuid-1', name: 'Test Cafe', subdomain: 'test-cafe', slug: 'test-cafe' },
  },
}

function fakeSupabase({ sessionData = validSessionData, sessionError = null } = {}) {
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

function makeReq({ method = 'GET', headers = {} } = {}) {
  return { method, headers }
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

describe('GET /api/auth/session (task 1.4, SEC-002)', () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = SECRET
  })
  afterEach(() => {
    if (REAL_SECRET === undefined) delete process.env.SUPABASE_JWT_SECRET
    else process.env.SUPABASE_JWT_SECRET = REAL_SECRET
  })

  it('returns the session payload with a fresh JWT inline (200)', async () => {
    const handler = createSessionHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: { authorization: 'Bearer session-token-1' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.admin.id).toBe('admin-uuid-1')
    expect(res.body.admin.role).toBe('tenant_admin')
    expect(res.body.tenant.id).toBe('tenant-uuid-1')
    expect(res.body.sessionToken).toBe('session-token-1')
    expect(res.body.token).toBeTruthy()

    const decoded = jwt.verify(res.body.token, SECRET, { issuer: 'tappmesa-api' })
    expect(decoded.role).toBe('authenticated')
    expect(decoded.app_tenant_id).toBe('tenant-uuid-1')
  })

  it('SEC-001/002: inline token includes expires_at (unix seconds) equal to the JWT exp', async () => {
    const handler = createSessionHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: { authorization: 'Bearer session-token-1' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.expires_at).toBeTypeOf('number')
    const decoded = jwt.verify(res.body.token, SECRET, { issuer: 'tappmesa-api' })
    expect(res.body.expires_at).toBe(decoded.exp)
    expect(decoded.exp - decoded.iat).toBe(3600)
  })

  it('degrades to token null + expires_at null when SUPABASE_JWT_SECRET is missing (no 500)', async () => {
    delete process.env.SUPABASE_JWT_SECRET
    const handler = createSessionHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: { authorization: 'Bearer session-token-1' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBeNull()
    expect(res.body.expires_at).toBeNull()
    expect(res.body.admin.id).toBe('admin-uuid-1') // sesión igual válida
  })

  it('returns 401 without a token when the session is invalid', async () => {
    const handler = createSessionHandler({
      supabase: fakeSupabase({ sessionData: null, sessionError: { message: 'no row' } }),
    })
    const res = makeRes()

    await handler(makeReq({ headers: { authorization: 'Bearer bogus' } }), res)

    expect(res.statusCode).toBe(401)
    expect(res.body.token).toBeUndefined()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const handler = createSessionHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ headers: {} }), res)

    expect(res.statusCode).toBe(401)
  })

  it('returns 405 for non-GET methods', async () => {
    const handler = createSessionHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ method: 'POST' }), res)

    expect(res.statusCode).toBe(405)
  })
})