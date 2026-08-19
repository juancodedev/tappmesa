import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrdersHandler } from '../../../api/orders.js'
import { generateCapabilityToken } from '../../../api/utils/capability.js'

const SECRET = 'test-capability-secret'
const CAP = generateCapabilityToken({ table_session_id: 'ts-1' }, SECRET)

const sessionRow = {
  id: 'ts-1',
  tenant_id: 'tenant-uuid-1',
  status: 'active',
  ended_at: null,
}

const createdOrder = {
  id: 'order-1',
  tenant_id: 'tenant-uuid-1',
  order_number: '260819-ABC123',
  status: 'pending',
  subtotal: '5000.00',
  tax: '950.00',
  total: '5950.00',
}

function makeReq({ method = 'POST', url = '/api/orders', headers = {}, body = {}, query = {} } = {}) {
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

// Fake supabase con estado mutable: el test setea el resultado ANTES de cada await.
function fakeSupabase() {
  const state = {
    sessionResult: { data: sessionRow, error: null },
    tenantResult: { data: { id: 'tenant-uuid-1' }, error: null },
    idemResult: { data: null, error: { message: 'PGRST116: not found' } },
    listResult: { data: [], error: null },
    updateResult: { data: [createdOrder], error: null },
    rpcResult: { data: createdOrder, error: null },
  }

  const from = vi.fn((table) => {
    const chain = { isUpdate: false }
    for (const key of ['select', 'eq', 'in', 'order', 'limit']) {
      chain[key] = vi.fn(() => chain)
    }
    chain.update = vi.fn(() => {
      chain.isUpdate = true
      return chain
    })
    chain.maybeSingle = vi.fn(
      async () =>
        (table === 'table_sessions' && state.sessionResult) ||
        (table === 'tenants' && state.tenantResult) ||
        state.idemResult,
    )
    chain.single = chain.maybeSingle
    // Terminal: `await from(...)...` resuelve al resultado según tabla/operación.
    chain.then = function (resolve) {
      if (table === 'table_sessions') return resolve(state.sessionResult)
      if (table === 'tenants') return resolve(state.tenantResult)
      if (chain.isUpdate) return resolve(state.updateResult)
      return resolve(state.listResult)
    }
    return chain
  })

  return {
    state,
    from,
    rpc: vi.fn(async () => state.rpcResult),
  }
}

describe('POST /api/orders (place, task 1.7)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createOrdersHandler({ supabase })
  })

  const validBody = {
    items: [{ product_id: 'prod-1', quantity: 2, temperature: 'hot', notes: 'sin hielo' }],
    idempotency_key: 'idem-1',
    customer_name: 'Ana',
    customer_phone: '+56912345678',
  }

  it('places an order via the db function (201) and folds temperature into notes', async () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${CAP}` },
      body: validBody,
    })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.order.id).toBe('order-1')
    expect(res.body.order.total).toBe('5950.00') // IVA server-computed, no del cliente

    expect(supabase.from).toHaveBeenCalledWith('table_sessions')
    expect(supabase.rpc).toHaveBeenCalledWith('tappmesa_place_order', {
      p_tenant_id: 'tenant-uuid-1',
      p_table_session_id: 'ts-1',
      p_customer_name: 'Ana',
      p_customer_phone: '+56912345678',
      p_idempotency_key: 'idem-1',
      p_items: [
        { product_id: 'prod-1', quantity: 2, notes: 'Temperatura: hot | sin hielo' },
      ],
    })
  })

  it('returns the existing order (200) on double-submit without calling the function again', async () => {
    supabase.state.idemResult = { data: { id: 'order-1' }, error: null }
    const req = makeReq({ headers: { authorization: `Bearer ${CAP}` }, body: validBody })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('supports takeout when no capability is provided (Host resolution, null session)', async () => {
    const req = makeReq({
      headers: { host: 'cafe-x-tappmesa.vercel.app' },
      body: validBody,
    })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(201)
    expect(supabase.rpc).toHaveBeenCalledWith(
      'tappmesa_place_order',
      expect.objectContaining({
        p_tenant_id: 'tenant-uuid-1',
        p_table_session_id: null,
      }),
    )
  })

  it('rejects unknown capability with 401 (no existence leak)', async () => {
    supabase.state.sessionResult = { data: null, error: { message: 'PGRST116: not found' } }
    const req = makeReq({ headers: { authorization: 'Bearer v1.cap.bogus.aaaa' }, body: validBody })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('ignores custom session headers (R2-5/SEC-006: no custom headers)', async () => {
    const req = makeReq({
      headers: { 'x-session-id': 'sess-evil' },
      body: validBody,
    })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/capability|tenant/i)
  })

  it('requires an idempotency_key (400) for replay safety', async () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${CAP}` },
      body: { items: [{ product_id: 'prod-1', quantity: 1 }] },
    })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/idempotency/i)
  })

  it('never mints a JWT for the customer flow (SEC-001)', async () => {
    const req = makeReq({ headers: { authorization: `Bearer ${CAP}` }, body: validBody })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.token).toBeUndefined()
  })

  it('returns 405 for GET /api/orders', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'GET', url: '/api/orders' }), res)
    expect(res.statusCode).toBe(405)
  })
})

describe('GET /api/orders/my (task 1.7)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createOrdersHandler({ supabase })
  })

  it('returns 400 when the capability query param is missing', async () => {
    const res = makeRes()
    await handler(makeReq({ method: 'GET', url: '/api/orders/my' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/capability/i)
  })

  it('returns 200 [] for an unknown capability', async () => {
    supabase.state.sessionResult = { data: null, error: { message: 'PGRST116: not found' } }
    const res = makeRes()
    await handler(
      makeReq({ method: 'GET', url: '/api/orders/my', query: { capability: 'v1.cap.bogus.x' } }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.orders).toEqual([])
  })

  it('returns the session orders for a valid capability', async () => {
    supabase.state.listResult = { data: [createdOrder], error: null }
    const res = makeRes()
    await handler(
      makeReq({ method: 'GET', url: '/api/orders/my', query: { capability: CAP } }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.orders).toHaveLength(1)
    expect(supabase.from).toHaveBeenCalledWith('orders')
  })
})

describe('POST /api/orders/:id/cancel (task 1.7)', () => {
  let supabase
  let handler

  beforeEach(() => {
    supabase = fakeSupabase()
    handler = createOrdersHandler({ supabase })
  })

  it('returns { cancelled: false } for a foreign order (0 rows, no leak)', async () => {
    supabase.state.updateResult = { data: [], error: null }
    const res = makeRes()
    await handler(
      makeReq({
        url: '/api/orders/order-foreign/cancel',
        headers: { authorization: `Bearer ${CAP}` },
      }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.cancelled).toBe(false)
    expect(res.body.order).toBeUndefined()
  })

  it('cancels an own pending order and returns it', async () => {
    supabase.state.updateResult = { data: [createdOrder], error: null }
    const res = makeRes()
    await handler(
      makeReq({
        url: '/api/orders/order-1/cancel',
        headers: { authorization: `Bearer ${CAP}` },
      }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.cancelled).toBe(true)
    expect(res.body.order.id).toBe('order-1')
  })

  it('rejects cancel with an unknown capability (401)', async () => {
    supabase.state.sessionResult = { data: null, error: { message: 'PGRST116: not found' } }
    const res = makeRes()
    await handler(
      makeReq({
        url: '/api/orders/order-1/cancel',
        headers: { authorization: 'Bearer v1.cap.bogus.aaaa' },
      }),
      res,
    )
    expect(res.statusCode).toBe(401)
    expect(supabase.state.updateResult).toBeDefined()
    expect(supabase.from).not.toHaveBeenCalledWith('orders')
  })
})