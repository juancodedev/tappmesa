import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWaiterCallsHandler } from '../../../api/waiter-calls.js'

// call-waiter T2 (odd/tasks/call-waiter.md S2, S4-S7, S10): customers create,
// read and cancel their own call through the table-session capability.

const CAP = 'ts_capability-token'
const CALL_ID = '11111111-2222-4333-8444-555555555555'

const sessionRow = { id: 'ts-1', tenant_id: 'tenant-1', status: 'active', ended_at: null }

const future = () => new Date(Date.now() + 4 * 60 * 1000).toISOString()
const past = () => new Date(Date.now() - 1000).toISOString()

const pendingCall = (overrides = {}) => ({
  id: 'call-1',
  tenant_id: 'tenant-1',
  table_id: 'table-1',
  table_session_id: 'ts-1',
  reason: 'assistance',
  status: 'pending',
  created_at: new Date().toISOString(),
  expires_at: future(),
  resolved_at: null,
  resolved_by: null,
  ...overrides,
})

function makeReq({ method = 'POST', url = '/api/waiter-calls', headers = {}, body = {}, query = {} } = {}) {
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
    sessionResult: { data: sessionRow, error: null },
    latestResult: { data: null, error: null },
    updateResult: { data: [], error: null },
    rpcResult: { data: [pendingCall()], error: null },
  }
  const chains = []

  const from = vi.fn((table) => {
    const chain = { table, isUpdate: false, updateValues: null }
    for (const key of ['select', 'eq', 'in', 'gt', 'lte', 'order', 'limit']) {
      chain[key] = vi.fn(() => chain)
    }
    chain.update = vi.fn((values) => {
      chain.isUpdate = true
      chain.updateValues = values
      return chain
    })
    chain.maybeSingle = vi.fn(async () =>
      table === 'table_sessions' ? state.sessionResult : state.latestResult,
    )
    chain.then = function (resolve) {
      if (chain.isUpdate) return resolve(state.updateResult)
      return resolve(state.latestResult)
    }
    chains.push(chain)
    return chain
  })

  return { state, chains, from, rpc: vi.fn(async () => state.rpcResult) }
}

const eqArgs = (chain) => chain.eq.mock.calls.map(([k, v]) => `${k}=${v}`)

describe('POST /api/waiter-calls (request a waiter)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createWaiterCallsHandler({ supabase })
  })

  it('creates the call through the db function with the session id and reason (S2)', async () => {
    supabase.state.rpcResult = { data: [pendingCall({ reason: 'bill' })], error: null }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP, reason: 'bill' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.call).toMatchObject({ id: 'call-1', reason: 'bill', status: 'pending' })
    expect(supabase.rpc).toHaveBeenCalledWith('tappmesa_request_waiter_call', {
      p_table_session_id: 'ts-1',
      p_reason: 'bill',
    })
    const sessionChain = supabase.chains.find((c) => c.table === 'table_sessions')
    expect(eqArgs(sessionChain)).toContain(`capability_token=${CAP}`)
  })

  it('defaults the reason to assistance (S2)', async () => {
    await handler(makeReq({ body: { capability: CAP } }), makeRes())

    expect(supabase.rpc).toHaveBeenCalledWith('tappmesa_request_waiter_call', {
      p_table_session_id: 'ts-1',
      p_reason: 'assistance',
    })
  })

  it('returns the call the db function hands back when one is already pending (S4)', async () => {
    supabase.state.rpcResult = { data: [pendingCall({ id: 'existing-call' })], error: null }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP, reason: 'other' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.call.id).toBe('existing-call')
  })

  it('rejects an unknown reason with 400 without calling the db', async () => {
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP, reason: 'party' } }), res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBeTruthy()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('rejects a missing or unknown capability with 401 (S10)', async () => {
    const missing = makeRes()
    await handler(makeReq({ body: {} }), missing)
    expect(missing.statusCode).toBe(401)

    supabase.state.sessionResult = { data: null, error: null }
    const unknown = makeRes()
    await handler(makeReq({ body: { capability: 'ts_forged' } }), unknown)
    expect(unknown.statusCode).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('rejects a closed table session with 401 (S10)', async () => {
    supabase.state.sessionResult = {
      data: { ...sessionRow, status: 'closed', ended_at: new Date().toISOString() },
      error: null,
    }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('maps WAITER_CALLS_DISABLED to 403 (S7)', async () => {
    supabase.state.rpcResult = { data: null, error: { message: 'WAITER_CALLS_DISABLED' } }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(403)
    expect(res.body.code).toBe('WAITER_CALLS_DISABLED')
  })

  it('maps WAITER_CALL_COOLDOWN to 429 with the seconds to wait (S5)', async () => {
    supabase.state.rpcResult = {
      data: null,
      error: { message: 'WAITER_CALL_COOLDOWN', details: '42' },
    }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(429)
    expect(res.body).toMatchObject({ code: 'WAITER_CALL_COOLDOWN', retry_after: 42 })
    expect(res.getHeader('Retry-After')).toBe('42')
  })

  it('maps SESSION_NOT_ACTIVE from the db to 401', async () => {
    supabase.state.rpcResult = { data: null, error: { message: 'SESSION_NOT_ACTIVE' } }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(401)
  })

  it('answers 500 on an unexpected db error without leaking it', async () => {
    supabase.state.rpcResult = { data: null, error: { message: 'connection reset' } }
    const res = makeRes()

    await handler(makeReq({ body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(500)
    expect(JSON.stringify(res.body)).not.toMatch(/connection reset/)
  })
})

describe('GET /api/waiter-calls/current (customer view)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createWaiterCallsHandler({ supabase })
  })

  const getReq = (query = { capability: CAP }) =>
    makeReq({ method: 'GET', url: '/api/waiter-calls/current', query })

  it('returns the latest call of the session (S2, S8)', async () => {
    supabase.state.latestResult = { data: pendingCall({ status: 'attended' }), error: null }
    const res = makeRes()

    await handler(getReq(), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.call).toMatchObject({ id: 'call-1', status: 'attended' })
    const callChain = supabase.chains.find((c) => c.table === 'waiter_calls')
    expect(eqArgs(callChain)).toContain('table_session_id=ts-1')
  })

  it('reports a pending call past expires_at as expired and flips it (S6)', async () => {
    supabase.state.latestResult = { data: pendingCall({ expires_at: past() }), error: null }
    const res = makeRes()

    await handler(getReq(), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.call.status).toBe('expired')
    const update = supabase.chains.find((c) => c.isUpdate)
    expect(update.updateValues).toMatchObject({ status: 'expired' })
    expect(eqArgs(update)).toEqual(expect.arrayContaining(['id=call-1', 'status=pending']))
  })

  it('returns call null for an unknown capability without revealing existence (S10)', async () => {
    supabase.state.sessionResult = { data: null, error: null }
    const res = makeRes()

    await handler(getReq({ capability: 'ts_forged' }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ call: null })
  })

  it('requires the capability query parameter', async () => {
    const res = makeRes()

    await handler(getReq({}), res)

    expect(res.statusCode).toBe(400)
  })
})

describe('POST /api/waiter-calls/:id/cancel', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createWaiterCallsHandler({ supabase })
  })

  const cancelReq = (body = { capability: CAP }) =>
    makeReq({ url: `/api/waiter-calls/${CALL_ID}/cancel`, body })

  it('cancels only a pending call of the caller session (S2, S10)', async () => {
    supabase.state.updateResult = { data: [pendingCall({ status: 'cancelled' })], error: null }
    const res = makeRes()

    await handler(cancelReq(), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ cancelled: true, call: { status: 'cancelled' } })
    const update = supabase.chains.find((c) => c.isUpdate)
    expect(update.updateValues).toMatchObject({ status: 'cancelled' })
    expect(eqArgs(update)).toEqual(
      expect.arrayContaining([`id=${CALL_ID}`, 'table_session_id=ts-1', 'status=pending']),
    )
    // An expired call is not cancellable, so it never starts the cooldown (S6).
    expect(update.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })

  it('answers cancelled false for a call of another session or already resolved', async () => {
    supabase.state.updateResult = { data: [], error: null }
    const res = makeRes()

    await handler(cancelReq(), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ cancelled: false })
  })

  it('answers cancelled false for an id that is not a uuid, without querying', async () => {
    const res = makeRes()

    await handler(makeReq({ url: '/api/waiter-calls/abc/cancel', body: { capability: CAP } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ cancelled: false })
    expect(supabase.chains.some((c) => c.isUpdate)).toBe(false)
  })

  it('rejects an unknown capability with 401', async () => {
    supabase.state.sessionResult = { data: null, error: null }
    const res = makeRes()

    await handler(cancelReq({ capability: 'ts_forged' }), res)

    expect(res.statusCode).toBe(401)
    expect(supabase.chains.some((c) => c.isUpdate)).toBe(false)
  })
})

describe('method guard', () => {
  it('rejects other methods with 405', async () => {
    const handler = createWaiterCallsHandler({ supabase: fakeSupabase() })
    const res = makeRes()

    await handler(makeReq({ method: 'DELETE' }), res)

    expect(res.statusCode).toBe(405)
  })
})
