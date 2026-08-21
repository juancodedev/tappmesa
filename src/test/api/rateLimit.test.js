import { describe, it, expect, vi, afterEach } from 'vitest'

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
    get statusCode() {
      return state.statusCode
    },
    get body() {
      return state.body
    },
    get headers() {
      return state.headers
    },
  }
}

describe('rateLimiter burst (RTE-006, task 1.11)', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('blocks after the maxRequests burst and sets 429 headers', async () => {
    // Módulo fresco → memoryStore limpio (el rate limiting usa estado de módulo)
    vi.resetModules()
    const { rateLimiter, RATE_LIMITS } = await import('../../../lib/middleware/rateLimit.js')

    const key = 'auth/token'
    const max = RATE_LIMITS[key].maxRequests
    const req = { headers: {} } // sin IP → 'unknown' en cada llamada
    const res = makeRes()

    let blocked = false
    for (let i = 0; i < max + 1; i += 1) {
      blocked = await rateLimiter(key)(req, res)
    }

    expect(blocked).toBe(true)
    expect(res.body.error).toBeTruthy()
    expect(res.body.limit).toBe(max)
    expect(Number(res.headers['X-RateLimit-Limit'])).toBe(max)
    expect(res.headers['Retry-After']).toBeTruthy()
  })

  it('includes the new S1 endpoint keys in RATE_LIMITS', async () => {
    vi.resetModules()
    const { RATE_LIMITS } = await import('../../../lib/middleware/rateLimit.js')

    for (const key of ['auth/token', 'orders', 'orders/my', 'table-sessions', 'admin/users']) {
      expect(RATE_LIMITS[key], `missing key ${key}`).toBeDefined()
      expect(RATE_LIMITS[key].maxRequests).toBeGreaterThan(0)
    }
  })

  it('enforces the spec threshold for the orders key (RTE-005: 30/min/IP)', async () => {
    vi.resetModules()
    const { RATE_LIMITS } = await import('../../../lib/middleware/rateLimit.js')

    const orders = RATE_LIMITS['orders']
    expect(orders.maxRequests).toBe(30)
    expect(orders.windowMs).toBe(60 * 1000)
    expect(orders.message).toMatch(/minuto/i)
  })
})