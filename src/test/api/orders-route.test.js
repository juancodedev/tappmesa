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

// SEC-006 (R2-5): las capabilities viajan en body/query string, NUNCA en
// headers (ni Authorization ni custom). place/cancel leen `body.capability`;
// /my lee `?capability=`.
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
      body: { ...validBody, capability: CAP },
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
    const req = makeReq({ body: { ...validBody, capability: CAP } })
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
    const req = makeReq({ body: { ...validBody, capability: 'v1.cap.bogus.aaaa' } })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('SEC-006: ignores a capability sent via Authorization header (takeout path, 400 without Host)', async () => {
    const req = makeReq({
      headers: { authorization: `Bearer ${CAP}` }, // canal prohibido para capabilities
      body: validBody,
    })
    const res = makeRes()

    await handler(req, res)

    // La capability en Authorization NO autentica: sin body.capability el
    // flujo cae a takeout y sin Host reconocible responde 400.
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/capability|tenant/i)
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
      body: { items: [{ product_id: 'prod-1', quantity: 1 }], capability: CAP },
    })
    const res = makeRes()

    await handler(req, res)

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/idempotency/i)
  })

  it('never mints a JWT for the customer flow (SEC-001)', async () => {
    const req = makeReq({ body: { ...validBody, capability: CAP } })
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

  it('RTE-002: requests the embedded order_items→products shape identical to TableOrdersHistory.jsx:31-46 (CRITICAL-1)', async () => {
    supabase.state.listResult = { data: [createdOrder], error: null }
    const res = makeRes()
    await handler(
      makeReq({ method: 'GET', url: '/api/orders/my', query: { capability: CAP } }),
      res,
    )
    expect(res.statusCode).toBe(200)

    const ordersCallIdx = supabase.from.mock.calls.findIndex(([table]) => table === 'orders')
    expect(ordersCallIdx).toBeGreaterThanOrEqual(0)
    const ordersChain = supabase.from.mock.results[ordersCallIdx].value
    expect(ordersChain.select).toHaveBeenCalledWith(
      '*, order_items(*, product:products(id, name, price, image_url))',
    )
    expect(ordersChain.eq).toHaveBeenCalledWith('table_session_id', 'ts-1')
    expect(ordersChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('RTE-002: response carries orders with their embedded order_items→product rows (drop-in for the S2 pollers)', async () => {
    const embeddedOrder = {
      ...createdOrder,
      order_items: [
        {
          id: 'oi-1',
          product_id: 'prod-1',
          quantity: 2,
          unit_price: '2500.00',
          product: { id: 'prod-1', name: 'Café', price: '2500.00', image_url: '/cafe.jpg' },
        },
      ],
    }
    supabase.state.listResult = { data: [embeddedOrder], error: null }
    const res = makeRes()
    await handler(
      makeReq({ method: 'GET', url: '/api/orders/my', query: { capability: CAP } }),
      res,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body.orders).toHaveLength(1)
    expect(res.body.orders[0].order_items).toHaveLength(1)
    expect(res.body.orders[0].order_items[0].product.name).toBe('Café')
    expect(res.body.orders[0].order_items[0].product.image_url).toBe('/cafe.jpg')
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
        body: { capability: CAP },
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
        body: { capability: CAP },
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
        body: { capability: 'v1.cap.bogus.aaaa' },
      }),
      res,
    )
    expect(res.statusCode).toBe(401)
    expect(supabase.state.updateResult).toBeDefined()
    expect(supabase.from).not.toHaveBeenCalledWith('orders')
  })

  it('SEC-006: cancel requires the capability in the body (401 without it, even with Authorization)', async () => {
    const res = makeRes()
    await handler(
      makeReq({
        url: '/api/orders/order-1/cancel',
        headers: { authorization: `Bearer ${CAP}` },
        body: {},
      }),
      res,
    )
    expect(res.statusCode).toBe(401)
    expect(supabase.from).not.toHaveBeenCalledWith('orders')
  })
})