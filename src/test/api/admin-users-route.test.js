import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createAdminUsersHandler } from '../../../api/admin/users.js'

// Task 1.9 (spec ADM-001): CRUD /api/admin/users behind requireAuth.
//   * bcrypt 12 server-side; tenant_id/role from claims (super_admin may set
//     tenant_id); tenant_admin → own tenant + allowlist (never super_admin);
//     responses strip password_hash; dup-email per tenant; audit rows.
//   201/200/204 | 400 | 403 | 409 self-delete | 429.

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const SELF_ID = '11111111-1111-1111-1111-111111111111'
const OTHER_ID = '22222222-2222-2222-2222-222222222222'

const tenantAdminClaims = {
  sessionToken: 'sess-1',
  admin: { id: SELF_ID, email: 'admin@a.cl', full_name: 'Admin A', role: 'tenant_admin', tenant_id: TENANT_A },
  tenant: { id: TENANT_A },
}

const superAdminClaims = {
  sessionToken: 'sess-2',
  admin: { id: SELF_ID, email: 'root@tappmesa.cl', full_name: 'Root', role: 'super_admin', tenant_id: null },
  tenant: null,
}

const userRow = {
  id: OTHER_ID,
  tenant_id: TENANT_A,
  email: 'staff@a.cl',
  full_name: 'Staff A',
  phone: '+56912345678',
  role: 'staff',
  is_active: true,
  password_hash: '$2b$12$abcdefghijklmnopqrstuvwxyz0123456789',
  last_login: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

function makeReq({ method = 'POST', url = '/api/admin/users', headers = {}, body = {}, query = {} } = {}) {
  return { method, url, headers, body, query }
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

function fakeSupabase() {
  const state = {
    listResult: { data: [], error: null },
    maybeSingleResult: { data: null, error: { message: 'PGRST116: not found' } },
    singleResult: { data: userRow, error: null },
    insertResult: { data: userRow, error: null },
    updateResult: { data: userRow, error: null },
    deleteResult: { data: null, error: null },
    auditError: null,
  }

  const from = vi.fn((table) => {
    const chain = { isInsert: false, isUpdate: false, isDelete: false }
    for (const key of ['eq', 'neq', 'order', 'limit', 'select']) {
      chain[key] = vi.fn(() => chain)
    }
    chain.insert = vi.fn(() => {
      chain.isInsert = true
      return chain
    })
    chain.update = vi.fn(() => {
      chain.isUpdate = true
      return chain
    })
    chain.delete = vi.fn(() => {
      chain.isDelete = true
      return chain
    })
    chain.single = vi.fn(async () => state.singleResult)
    chain.maybeSingle = vi.fn(async () => state.maybeSingleResult)
    chain.then = function (resolve) {
      if (table === 'admin_audit_logs') {
        return resolve(state.auditError ? { data: null, error: state.auditError } : { data: [], error: null })
      }
      if (chain.isDelete) return resolve(state.deleteResult)
      if (chain.isUpdate) return resolve(state.updateResult)
      if (chain.isInsert) return resolve(state.insertResult)
      return resolve(state.listResult)
    }
    return chain
  })

  return { state, from }
}

// requireAuth falso: deja pasar y estampa claims (o rechaza 401 si se pide).
function fakeRequireAuth(claims) {
  return vi.fn(async (req, res) => {
    if (claims === null) {
      res.status(401).json({ error: 'No autorizado' })
      return true
    }
    req.adminSession = claims
    return false
  })
}

describe('CRUD /api/admin/users (task 1.9, ADM-001)', () => {
  let supabase
  let handler

  const createBody = {
    email: 'new@a.cl',
    password: 'StrongPass123',
    full_name: 'New Staff',
    phone: '+56912345678',
    role: 'staff',
    is_active: true,
  }

  beforeEach(() => {
    supabase = fakeSupabase()
  })

  describe('POST create', () => {
    it('stores a bcrypt $2 password_hash and never returns the key (201)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ body: createBody }), res)

      expect(res.statusCode).toBe(201)
      expect(res.body.user.password_hash).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('password_hash')

      // El insert lleva el hash bcrypt de 12 rondas
      const auCalls = supabase.from.mock.calls
      const insertIdx = auCalls.findIndex(([t], i) => t === 'admin_users' && supabase.from.mock.results[i].value.isInsert)
      const payload = supabase.from.mock.results[insertIdx].value.insert.mock.calls[0][0]
      expect(payload.password_hash).toMatch(/^\$2[aby]\$/)
      expect(payload.tenant_id).toBe(TENANT_A) // de claims, no del body
      expect(payload.role).toBe('staff')
    })

    it('writes an audit row on create', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ body: createBody }), res)

      expect(res.statusCode).toBe(201)
      const auditIdx = supabase.from.mock.calls.findIndex(([t]) => t === 'admin_audit_logs')
      expect(auditIdx).toBeGreaterThanOrEqual(0)
      const auditPayload = supabase.from.mock.results[auditIdx].value.insert.mock.calls[0][0]
      expect(auditPayload.action).toBe('create')
      expect(auditPayload.resource).toBe('admin_users')
      expect(auditPayload.resource_id).toBe(OTHER_ID)
      expect(auditPayload.tenant_id).toBe(TENANT_A)
      expect(JSON.stringify(auditPayload.new_values)).not.toContain('password_hash')
    })

    it('rejects tenant_admin escalation to super_admin (403)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ body: { ...createBody, role: 'super_admin' } }),
        res,
      )
      expect(res.statusCode).toBe(403)
      expect(supabase.from).not.toHaveBeenCalledWith('admin_users', expect.anything())
    })

    it('rejects tenant_admin setting another tenant (403)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ body: { ...createBody, tenant_id: TENANT_B } }),
        res,
      )
      expect(res.statusCode).toBe(403)
    })

    it('rejects duplicate email within the tenant (400)', async () => {
      supabase.state.maybeSingleResult = { data: { id: OTHER_ID }, error: null }
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ body: createBody }), res)
      expect(res.statusCode).toBe(400)
      expect(supabase.from.mock.results.find((r, i) => supabase.from.mock.calls[i][0] === 'admin_users' && r.value.isInsert)).toBeUndefined()
    })

    it('validates email/password/full_name (400)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ body: { email: 'nope', password: 'short', full_name: '' } }), res)
      expect(res.statusCode).toBe(400)
    })

    it('super_admin may set tenant_id and role super_admin (201)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(superAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ body: { ...createBody, role: 'super_admin', tenant_id: TENANT_B } }),
        res,
      )
      expect(res.statusCode).toBe(201)
      const insertIdx = supabase.from.mock.calls.findIndex(([t], i) => t === 'admin_users' && supabase.from.mock.results[i].value.isInsert)
      const payload = supabase.from.mock.results[insertIdx].value.insert.mock.calls[0][0]
      expect(payload.tenant_id).toBe(TENANT_B)
      expect(payload.role).toBe('super_admin')
    })

    it('requires auth (401) when requireAuth rejects', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(null),
      })
      const res = makeRes()
      await handler(makeReq({ body: createBody }), res)
      expect(res.statusCode).toBe(401)
    })
  })

  describe('GET list', () => {
    it('lists own-tenant users without password_hash (200)', async () => {
      supabase.state.listResult = { data: [userRow], error: null }
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ method: 'GET' }), res)

      expect(res.statusCode).toBe(200)
      expect(res.body.users).toHaveLength(1)
      expect(res.body.users[0].password_hash).toBeUndefined()
      expect(JSON.stringify(res.body)).not.toContain('password_hash')
    })

    it('super_admin without tenant filter lists all', async () => {
      supabase.state.listResult = { data: [userRow], error: null }
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(superAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ method: 'GET' }), res)
      expect(res.statusCode).toBe(200)
      expect(supabase.from.mock.results.find((r, i) => supabase.from.mock.calls[i][0] === 'admin_users').value.eq).not.toHaveBeenCalled()
    })
  })

  describe('PUT update', () => {
    it('updates fields and re-hashes password when provided (200)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ method: 'PUT', url: `/api/admin/users/${OTHER_ID}`, body: { full_name: 'Renamed', password: 'NewPass123' } }),
        res,
      )
      expect(res.statusCode).toBe(200)
      expect(res.body.user.password_hash).toBeUndefined()

      const updateIdx = supabase.from.mock.calls.findIndex(([t], i) => t === 'admin_users' && supabase.from.mock.results[i].value.isUpdate)
      const payload = supabase.from.mock.results[updateIdx].value.update.mock.calls[0][0]
      expect(payload.full_name).toBe('Renamed')
      expect(payload.password_hash).toMatch(/^\$2[aby]\$/)
    })

    it('rejects tenant_admin role escalation on update (403)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ method: 'PUT', url: `/api/admin/users/${OTHER_ID}`, body: { role: 'super_admin' } }),
        res,
      )
      expect(res.statusCode).toBe(403)
    })

    it('rejects tenant_admin changing tenant_id (403)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(
        makeReq({ method: 'PUT', url: `/api/admin/users/${OTHER_ID}`, body: { tenant_id: TENANT_B } }),
        res,
      )
      expect(res.statusCode).toBe(403)
    })
  })

  describe('DELETE', () => {
    it('rejects self-delete (409)', async () => {
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ method: 'DELETE', url: `/api/admin/users/${SELF_ID}` }), res)
      expect(res.statusCode).toBe(409)
    })

    it('deletes another user (204)', async () => {
      supabase.state.deleteResult = { data: [{ id: OTHER_ID }], error: null }
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ method: 'DELETE', url: `/api/admin/users/${OTHER_ID}` }), res)
      expect(res.statusCode).toBe(204)
    })

    it('returns 404 when the target is outside the tenant scope', async () => {
      supabase.state.deleteResult = { data: null, error: null }
      supabase.state.maybeSingleResult = { data: null, error: { message: 'PGRST116: not found' } }
      handler = createAdminUsersHandler({
        supabase,
        requireAuth: fakeRequireAuth(tenantAdminClaims),
      })
      const res = makeRes()
      await handler(makeReq({ method: 'DELETE', url: `/api/admin/users/${OTHER_ID}` }), res)
      expect(res.statusCode).toBe(404)
    })
  })
})