import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authService } from '../../lib/supabase.js'

// WARNING-5 / C5-001: `authenticatedFetch` (attach JWT → 401 → refresh una
// vez vía /api/auth/token → retry único → reload si la sesión murió) era
// código crítico de cliente sin tests. Estos tests fijan el contrato:
//   * 2xx  → devuelve la respuesta, sin refresh
//   * 401 + refresh OK + retry OK  → devuelve el retry (2 fetches)
//   * 401 + refresh OK + retry 401 → reload (sesión muerta)
//   * 401 + refresh falla → reload, sin retry adicional
//   * 5xx/red del refresh NO limpia localStorage (error transitorio)
//   * options.headers se mezclan (ganan sobre Authorization)

function jsonResponse(status, body = {}) {
  return { status, ok: status >= 200 && status < 300, json: async () => body }
}

beforeEach(() => {
  localStorage.clear()
  window.location.reload.mockClear()
  vi.restoreAllMocks()
})

afterEach(() => {
  // El stub global de fetch no debe filtrarse a otros archivos de test
  vi.unstubAllGlobals()
})

describe('authService.authenticatedFetch (C5-001/WARNING-5)', () => {
  it('envía la sesión en Authorization y no refresca en respuestas 2xx', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    const res = await authService.authenticatedFetch('/api/admin/users')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/admin/users')
    expect(opts.headers.Authorization).toBe('Bearer session-1')
    expect(res.status).toBe(200)
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('mezcla options.headers del caller (ganan sobre los de auth)', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201))
    vi.stubGlobal('fetch', fetchMock)

    await authService.authenticatedFetch('/api/admin/users', {
      method: 'POST',
      headers: { 'X-Custom': 'yes' },
    })

    const opts = fetchMock.mock.calls[0][1]
    expect(opts.headers.Authorization).toBe('Bearer session-1')
    expect(opts.headers['X-Custom']).toBe('yes')
  })

  it('401 → refresh OK (token real) → reintenta UNA vez y devuelve la respuesta del retry', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    localStorage.setItem('tappmesa-jwt', 'jwt-viejo')
    let userCalls = 0
    const fetchMock = vi.fn((url) => {
      const u = String(url)
      // refreshJwt (real) → /api/auth/token devuelve un token fresco
      if (u.includes('/api/auth/token')) {
        return Promise.resolve(jsonResponse(200, { token: 'jwt-fresco' }))
      }
      userCalls += 1
      return userCalls === 1
        ? Promise.resolve(jsonResponse(401))
        : Promise.resolve(jsonResponse(200, { ok: true }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await authService.authenticatedFetch('/api/admin/users')

    expect(fetchMock).toHaveBeenCalledTimes(3) // original + refresh + retry
    expect(res.status).toBe(200)
    expect(window.location.reload).not.toHaveBeenCalled()
    expect(localStorage.getItem('tappmesa-jwt')).toBe('jwt-fresco')
  })

  it('401 → refresh OK → retry de nuevo 401 → window.location.reload()', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    vi.spyOn(authService, 'refreshJwt').mockResolvedValue({ token: 'jwt-fresco' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    await authService.authenticatedFetch('/api/admin/users')

    expect(fetchMock).toHaveBeenCalledTimes(2) // intento + retry
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })

  it('401 → refresh falla (refreshed null) → reload sin retry adicional', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    const refreshMock = vi.spyOn(authService, 'refreshJwt').mockResolvedValue(null)
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    await authService.authenticatedFetch('/api/admin/users')

    expect(refreshMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1) // sin retry
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })

  it('401 → refresh devuelve error transitorio (5xx, sin token) → reload SIN limpiar keys', async () => {
    localStorage.setItem('tappmesa-session', 'session-1')
    localStorage.setItem('tappmesa-jwt', 'jwt-viejo')
    vi.spyOn(authService, 'refreshJwt').mockResolvedValue({ error: 'server down' })
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    await authService.authenticatedFetch('/api/admin/users')

    expect(window.location.reload).toHaveBeenCalledTimes(1)
    // C5: un 5xx/red no invalida la sesión — refreshJwt no limpió las keys
    expect(localStorage.getItem('tappmesa-jwt')).toBe('jwt-viejo')
    expect(localStorage.getItem('tappmesa-session')).toBe('session-1')
  })

  it('401 → sin session token (refreshJwt retorna null directo) → reload', async () => {
    // localStorage vacío: getSessionToken() → null
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401))
    vi.stubGlobal('fetch', fetchMock)

    await authService.authenticatedFetch('/api/admin/users')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(window.location.reload).toHaveBeenCalledTimes(1)
  })
})