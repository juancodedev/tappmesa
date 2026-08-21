import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import { createTableSessionsHandler } from '../../../api/table-sessions.js'

// Task 1.8 (spec RTE-004): POST /api/table-sessions
//   body {table_id, tenant_id} → verifica la fila de tables server-side
//   (tenant match, is_active, qr_code_expires_at no expirado), resume de la
//   sesión activa o INSERT con session_code y capability_token.
//   200 {session, resumed} | 201 {session} | 400 table not found/expired | 429.

const tableRow = {
  id: '11111111-1111-1111-1111-111111111111',
  tenant_id: '22222222-2222-2222-2222-222222222222',
  is_active: true,
  qr_code_expires_at: null,
}

const activeSession = {
  id: 'ts-1',
  tenant_id: '22222222-2222-2222-2222-222222222222',
  table_id: '11111111-1111-1111-1111-111111111111',
  session_code: 'TABLE1-M1ABC',
  status: 'active',
  started_at: '2026-08-19T12:00:00.000Z',
  ended_at: null,
}

function makeReq({ method = 'POST', url = '/api/table-sessions', headers = {}, body = {} } = {}) {
  return { method, url, headers, body, query: {} }
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

// Fake supabase: estado mutable por operación.
function fakeSupabase() {
  const state = {
    tableResult: { data: tableRow, error: null },
    existingResult: { data: null, error: { message: 'PGRST116: not found' } },
    newSession: {
      id: 'ts-new',
      tenant_id: '22222222-2222-2222-2222-222222222222',
      table_id: '11111111-1111-1111-1111-111111111111',
      session_code: 'TABLE1-M1ABC',
      status: 'active',
      capability_token: 'ts_.minted.in.test',
    },
    insertError: null,
  }

  const from = vi.fn((table) => {
    const chain = { isInsert: false, isSelect: false }
    for (const key of ['eq', 'in', 'order', 'limit']) {
      chain[key] = vi.fn(() => chain)
    }
    chain.select = vi.fn(() => {
      chain.isSelect = true
      return chain
    })
    chain.insert = vi.fn(() => {
      chain.isInsert = true
      return chain
    })
    chain.maybeSingle = vi.fn(async () => {
      if (table === 'tables') return state.tableResult
      if (chain.isInsert) {
        if (state.insertError) return { data: null, error: state.insertError }
        return { data: state.newSession, error: null }
      }
      return state.existingResult
    })
    chain.single = chain.maybeSingle
    // Terminal: `await from(...)...` resuelve según operación.
    chain.then = function (resolve) {
      if (table === 'tables') return resolve(state.tableResult)
      if (chain.isInsert) {
        if (state.insertError) return resolve({ data: null, error: state.insertError })
        return resolve({ data: state.newSession, error: null })
      }
      return resolve(state.existingResult)
    }
    return chain
  })

  return { state, from }
}

describe('POST /api/table-sessions (task 1.8)', () => {
  let supabase
  let handler

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret'
    supabase = fakeSupabase()
    handler = createTableSessionsHandler({ supabase })
    vi.restoreAllMocks()
  })

  afterAll(() => {
    delete process.env.SUPABASE_JWT_SECRET
  })

  it('creates a session (201) with server-side session_code and ts_ capability_token', async () => {
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )

    expect(res.statusCode).toBe(201)
    expect(res.body.session.id).toBe('ts-new')
    expect(supabase.from).toHaveBeenCalledWith('tables')

    // insert() recibe un payload con session_code/capability_token generados en el server
    const tsIndex = supabase.from.mock.results.findIndex(
      (r, i) => supabase.from.mock.calls[i][0] === 'table_sessions' && r.value.isInsert,
    )
    expect(tsIndex).toBeGreaterThanOrEqual(0)
    const tsChain = supabase.from.mock.results[tsIndex].value
    const insertPayload = tsChain.insert.mock.calls[0][0]
    expect(insertPayload.tenant_id).toBe('22222222-2222-2222-2222-222222222222')
    expect(insertPayload.table_id).toBe('11111111-1111-1111-1111-111111111111')
    expect(insertPayload.status).toBe('active')
    expect(insertPayload.session_code).toMatch(/^[A-Z0-9]+-[A-Z0-9]+$/)
    expect(insertPayload.capability_token).toMatch(/^ts_/)
    expect(insertPayload.capability_token.length).toBeGreaterThan(16)
  })

  it('resumes the active session (200, resumed:true) without inserting', async () => {
    supabase.state.existingResult = { data: activeSession, error: null }
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(res.body.session.id).toBe('ts-1')
    expect(res.body.resumed).toBe(true)
    const insertCalls = supabase.from.mock.calls.filter(([t]) => t === 'table_sessions')
    const chain = supabase.from.mock.results[supabase.from.mock.calls.indexOf(insertCalls[0])].value
    expect(chain.insert).not.toHaveBeenCalled()
  })

  it('rejects a table that does not exist (400)', async () => {
    supabase.state.tableResult = { data: null, error: { message: 'PGRST116: not found' } }
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '33333333-3333-3333-3333-333333333333', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('rejects an inactive table (400)', async () => {
    supabase.state.tableResult = { data: { ...tableRow, is_active: false }, error: null }
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )
    expect(res.statusCode).toBe(400)
  })

  it('rejects an expired QR code (400) and never creates a session', async () => {
    supabase.state.tableResult = {
      data: { ...tableRow, qr_code_expires_at: '2026-01-01T00:00:00.000Z' },
      error: null,
    }
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )
    expect(res.statusCode).toBe(400)
    const insertCalls = supabase.from.mock.calls.filter(([t]) => t === 'table_sessions')
    expect(insertCalls).toHaveLength(0)
  })

  it('accepts a table whose QR never expires (null qr_code_expires_at)', async () => {
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )
    expect(res.statusCode).toBe(201)
  })

  it('rejects a body without tenant_id (400)', async () => {
    const res = makeRes()
    await handler(makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111' } }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/table_id|tenant_id/i)
  })

  it('rejects a body without table_id (400)', async () => {
    const res = makeRes()
    await handler(makeReq({ body: { tenant_id: '22222222-2222-2222-2222-222222222222' } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('rejects non-POST (405)', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })

  it('SEC-006: never trusts a capability from headers/body — mints its own and returns it in the body', async () => {
    const res = makeRes()
    await handler(
      makeReq({
        headers: { authorization: 'Bearer client-bogus-cap' },
        body: {
          table_id: '11111111-1111-1111-1111-111111111111',
          tenant_id: '22222222-2222-2222-2222-222222222222',
          capability: 'client-provided-cap', // se ignora: nada de capabilities via input
        },
      }),
      res,
    )

    expect(res.statusCode).toBe(201)
    const tsIndex = supabase.from.mock.results.findIndex(
      (r, i) => supabase.from.mock.calls[i][0] === 'table_sessions' && r.value.isInsert,
    )
    const insertPayload = supabase.from.mock.results[tsIndex].value.insert.mock.calls[0][0]
    expect(insertPayload.capability_token).toMatch(/^ts_/)
    expect(insertPayload.capability_token).not.toBe('client-provided-cap')
    expect(insertPayload.capability_token.length).toBeGreaterThan(16)
    // La capability viaja en la respuesta (body), nunca por un header.
    expect(res.body.session.capability_token).toMatch(/^ts_/)
  })

  it('returns 500 and logs when the create insert fails', async () => {
    supabase.state.insertError = { message: 'insert failed' }
    const res = makeRes()
    await handler(
      makeReq({ body: { table_id: '11111111-1111-1111-1111-111111111111', tenant_id: '22222222-2222-2222-2222-222222222222' } }),
      res,
    )
    expect(res.statusCode).toBe(500)
  })
})