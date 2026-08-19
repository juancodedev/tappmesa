import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import { createResetPasswordHandler } from '../../../api/auth/reset-password.js'

// Task 1.10 (spec ADM-002): reset tokens minted server-side
// (crypto.randomBytes(32), 24h), previous tokens invalidated, no public
// generate_password_reset_token RPC; rate limits on request/confirm/reset.

const USER_ID = '22222222-2222-2222-2222-222222222222'
const TOKEN_ID = '33333333-3333-3333-3333-333333333333'

const userRow = {
  id: USER_ID,
  email: 'staff@a.cl',
  full_name: 'Staff A',
  tenant_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
}

const resetTokenRow = {
  id: TOKEN_ID,
  token: 'a'.repeat(64),
  user_id: USER_ID,
  expires_at: '2099-01-01T00:00:00.000Z',
  used_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  user: userRow,
}

// IP única por prueba para no contaminar el rate limit en memoria.
let ipCounter = 0
function nextIp() {
  ipCounter += 1
  return `203.0.113.${ipCounter}`
}

function makeReq({ method = 'POST', url = '/api/auth/reset-password', headers = {}, body = {} } = {}) {
  return {
    method,
    url,
    headers: { 'x-forwarded-for': nextIp(), ...headers },
    body,
  }
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
    calls: [],
    adminUserResult: { data: userRow, error: null },
    tokenResult: { data: resetTokenRow, error: null },
    insertResult: { data: null, error: null },
    updateResult: { data: null, error: null },
    deleteResult: { data: null, error: null },
    notFoundResult: { data: null, error: { message: 'PGRST116: not found' } },
  }

  const from = vi.fn((table) => {
    const chain = { isInsert: false, isUpdate: false, isDelete: false }
    const record = (method) =>
      vi.fn((...args) => {
        state.calls.push({ table, method, args })
        return chain
      })

    for (const key of ['eq', 'neq', 'gt', 'is', 'order', 'limit', 'select']) {
      chain[key] = record(key)
    }
    chain.insert = record('insert')
    chain.update = record('update')
    chain.delete = record('delete')
    chain.single = vi.fn(async () => {
      state.calls.push({ table, method: 'single', args: [] })
      if (table === 'admin_users') return state.adminUserResult
      return state.tokenResult
    })
    chain.maybeSingle = chain.single
    chain.then = function (resolve) {
      if (chain.isDelete) return resolve(state.deleteResult)
      if (chain.isUpdate) return resolve(state.updateResult)
      if (chain.isInsert) return resolve(state.insertResult)
      return resolve({ data: [], error: null })
    }
    return chain
  })

  const callsFor = (table, method) => state.calls.filter((c) => c.table === table && c.method === method)

  return { state, from, callsFor }
}

describe('POST /api/auth/reset-password (task 1.10, ADM-002)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createResetPasswordHandler({ supabase })
  })

  it('405 en métodos no POST', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  describe('request (/request)', () => {
    it('400 si falta email', async () => {
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: {} }), res)
      expect(res.statusCode).toBe(400)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('200 genérico si el email no existe (no filtra existencia)', async () => {
      supabase.state.adminUserResult = supabase.state.notFoundResult
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'ghost@x.cl' } }), res)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('Si el email existe')
      // No se inserta token para usuarios inexistentes
      expect(supabase.callsFor('password_reset_tokens', 'insert')).toHaveLength(0)
      expect(supabase.callsFor('password_reset_tokens', 'delete')).toHaveLength(0)
    })

    it('200 genérico si el usuario está inactivo', async () => {
      supabase.state.adminUserResult = supabase.state.notFoundResult
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' } }), res)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('Si el email existe')
    })

    it('NUNCA llama a la función pública generate_password_reset_token', async () => {
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' } }), res)
      expect(supabase.from.mock.calls.flat().includes('generate_password_reset_token')).toBe(false)
      expect(supabase.from.mock.calls.flat().includes('rpc')).toBe(false)
    })

    it('invalida tokens previos del usuario', async () => {
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' } }), makeRes())
      const deletes = supabase.callsFor('password_reset_tokens', 'delete')
      expect(deletes).toHaveLength(1)
      const eqs = supabase.state.calls.filter((c) => c.table === 'password_reset_tokens' && c.method === 'eq')
      expect(eqs.map((c) => c.args)).toContainEqual(['user_id', USER_ID])
    })

    it('inserta token server-side: 64 hex, expira en ~24h, usado como null', async () => {
      const before = Date.now()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' } }), makeRes())
      const ins = supabase.callsFor('password_reset_tokens', 'insert')
      expect(ins).toHaveLength(1)
      const row = ins[0].args[0][0]
      expect(row.token).toMatch(/^[0-9a-f]{64}$/)
      expect(row.user_id).toBe(USER_ID)
      expect(row.used_at).toBeUndefined()
      const expires = new Date(row.expires_at).getTime()
      expect(expires - before).toBeGreaterThan(23.5 * 60 * 60 * 1000)
      expect(expires - before).toBeLessThan(24.5 * 60 * 60 * 1000)
    })

    it('responde 200 genérico y registra auditoría password_reset_requested', async () => {
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' } }), res)
      expect(res.statusCode).toBe(200)
      expect(res.body.message).toContain('Si el email existe')
      const audit = supabase.callsFor('admin_audit_logs', 'insert')
      expect(audit).toHaveLength(1)
      expect(audit[0].args[0][0].action).toBe('password_reset_requested')
      expect(audit[0].args[0][0].user_id).toBe(USER_ID)
    })

    it('429 tras exceder el rate limit de request (3/15min)', async () => {
      const ip = nextIp()
      for (let i = 0; i < 3; i++) {
        const res = makeRes()
        await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' }, headers: { 'x-forwarded-for': ip } }), res)
        expect(res.statusCode).toBe(200)
      }
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/request', body: { email: 'staff@a.cl' }, headers: { 'x-forwarded-for': ip } }), res)
      expect(res.statusCode).toBe(429)
    })
  })

  describe('confirm (/confirm)', () => {
    it('400 si falta token', async () => {
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/confirm', body: {} }), res)
      expect(res.statusCode).toBe(400)
    })

    it('400 si el token es inválido o expiró', async () => {
      supabase.state.tokenResult = supabase.state.notFoundResult
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/confirm', body: { token: 'bad' } }), res)
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toContain('inválido o expirado')
    })

    it('200 con email/full_name si el token es válido', async () => {
      const res = makeRes()
      await handler(makeReq({ url: '/api/auth/reset-password/confirm', body: { token: 'a'.repeat(64) } }), res)
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.user).toEqual({ email: 'staff@a.cl', full_name: 'Staff A' })
    })
  })

  describe('reset (POST base)', () => {
    it('400 si faltan token o contraseña', async () => {
      const res = makeRes()
      await handler(makeReq({ body: { token: 'x' } }), res)
      expect(res.statusCode).toBe(400)
    })

    it('400 si la contraseña es débil', async () => {
      const res = makeRes()
      await handler(makeReq({ body: { token: 'a'.repeat(64), newPassword: 'abc' } }), res)
      expect(res.statusCode).toBe(400)
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('400 si el token es inválido o expiró', async () => {
      supabase.state.tokenResult = supabase.state.notFoundResult
      const res = makeRes()
      await handler(makeReq({ body: { token: 'bad', newPassword: 'NuevaPassword123!' } }), res)
      expect(res.statusCode).toBe(400)
    })

    it('re-hashea con bcrypt, marca token usado, invalida sesiones y audita', async () => {
      const res = makeRes()
      await handler(makeReq({ body: { token: 'a'.repeat(64), newPassword: 'NuevaPassword123!' } }), res)
      expect(res.statusCode).toBe(200)

      // Admin user update: hash bcrypt $2 y needs_password_reset false
      const userUpdate = supabase.callsFor('admin_users', 'update')
      expect(userUpdate).toHaveLength(1)
      const payload = userUpdate[0].args[0]
      expect(payload.password_hash.startsWith('$2')).toBe(true)
      expect(payload.needs_password_reset).toBe(false)
      const realHash = await bcrypt.compare('NuevaPassword123!', payload.password_hash)
      expect(realHash).toBe(true)

      // Marcar token como usado
      const tokenUpdate = supabase.callsFor('password_reset_tokens', 'update')
      expect(tokenUpdate).toHaveLength(1)
      expect(tokenUpdate[0].args[0].used_at).toBeTruthy()
      const tokenEqs = supabase.state.calls.filter((c) => c.table === 'password_reset_tokens' && c.method === 'eq')
      expect(tokenEqs.map((c) => c.args)).toContainEqual(['id', TOKEN_ID])

      // Invalidar sesiones del usuario
      const sessionDeletes = supabase.callsFor('admin_sessions', 'delete')
      expect(sessionDeletes).toHaveLength(1)

      // Auditoría
      const audit = supabase.callsFor('admin_audit_logs', 'insert')
      expect(audit).toHaveLength(1)
      expect(audit[0].args[0][0].action).toBe('password_reset_completed')
    })

    // 11 invocaciones reales de la ruta (bcrypt server-side) → lento bajo
    // carga paralela de vitest; timeout extendido (infra de test, sin cambio
    // de contrato).
    it('429 si se abusa del reset (10/h)', async () => {
      const ip = nextIp()
      for (let i = 0; i < 10; i++) {
        const res = makeRes()
        await handler(makeReq({ body: { token: 'a'.repeat(64), newPassword: 'NuevaPassword123!' }, headers: { 'x-forwarded-for': ip } }), res)
        expect(res.statusCode).toBe(200)
      }
      const res = makeRes()
      await handler(makeReq({ body: { token: 'a'.repeat(64), newPassword: 'NuevaPassword123!' }, headers: { 'x-forwarded-for': ip } }), res)
      expect(res.statusCode).toBe(429)
    }, 15000)
  })
})