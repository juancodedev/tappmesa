import { describe, it, expect, vi } from 'vitest'
import { createRequireAuth } from '../../../lib/middleware/requireAuth.js'

// Cliente supabase fake: la query esperada es
//   from('admin_sessions').select(...).eq('session_token', t).gt('expires_at', now).single()
function fakeSupabase({ sessionData, sessionError }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gt: vi.fn(() => ({
            single: vi.fn(async () => ({ data: sessionData, error: sessionError })),
          })),
        })),
      })),
    })),
  }
}

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

function makeReq(headers = {}) {
  return { headers }
}

function makeRes() {
  const res = { statusCode: 200, body: null }
  return {
    status(code) {
      res.statusCode = code
      return this
    },
    json(data) {
      res.body = data
    },
    get statusCode() {
      return res.statusCode
    },
    get body() {
      return res.body
    },
  }
}

describe('requireAuth (task 1.3, 401 invalid/expired, claim shape)', () => {
  it('attaches claims to req and calls next for a valid session', async () => {
    const requireAuth = createRequireAuth(fakeSupabase({ sessionData: validSessionRow }))
    const req = makeReq({ authorization: 'Bearer session-token-1' })
    const next = vi.fn()

    await requireAuth(req, makeRes(), next)

    expect(req.adminSession).toBeDefined()
    expect(req.adminSession.admin.email).toBe('admin@test.com')
    expect(req.adminSession.admin.role).toBe('tenant_admin')
    expect(req.adminSession.admin.tenant_id).toBe('tenant-uuid-1')
    expect(req.adminSession.tenant.subdomain).toBe('test-cafe')
    expect(req.adminSession.sessionToken).toBe('session-token-1')
    expect(next).toHaveBeenCalled()
  })

  it('rejects with 401 and no claims when Authorization header is missing', async () => {
    const requireAuth = createRequireAuth(fakeSupabase({ sessionData: validSessionRow }))
    const req = makeReq({})
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBeTruthy()
    expect(req.adminSession).toBeUndefined()
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the session token is unknown', async () => {
    const requireAuth = createRequireAuth(
      fakeSupabase({ sessionData: null, sessionError: { message: 'PGRST116: not found' } }),
    )
    const req = makeReq({ authorization: 'Bearer unknown-token' })
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the session has no admin_user row', async () => {
    const requireAuth = createRequireAuth(
      fakeSupabase({ sessionData: { ...validSessionRow, admin_user: null }, sessionError: null }),
    )
    const req = makeReq({ authorization: 'Bearer orphan-session' })
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('rejects with 401 when the admin user is inactive', async () => {
    const requireAuth = createRequireAuth(
      fakeSupabase({
        sessionData: {
          ...validSessionRow,
          admin_user: { ...validSessionRow.admin_user, is_active: false },
        },
        sessionError: null,
      }),
    )
    const req = makeReq({ authorization: 'Bearer disabled-admin' })
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 for any db error', async () => {
    const requireAuth = createRequireAuth(
      fakeSupabase({ sessionData: null, sessionError: { message: 'boom' } }),
    )
    const req = makeReq({ authorization: 'Bearer token' })
    const res = makeRes()
    const next = vi.fn()

    await requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(next).not.toHaveBeenCalled()
  })
})