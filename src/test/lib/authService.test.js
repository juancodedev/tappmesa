import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resetAllMocks } from '../utils'

import { authService, supabase } from '../../lib/supabase'

// ============================================================
// T1: Test helpers — mockFetch factories
// ============================================================
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockFetchSuccess(body) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body)
  })
}

function mockFetchError(status, errorMsg) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMsg })
  })
}

function mockFetchNetworkError() {
  mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
}

// ============================================================
// Tests
// ============================================================
describe('authService', () => {
  beforeEach(() => {
    resetAllMocks()
    mockFetch.mockClear()
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  // ------------------------------------------------------------------
  // T2: signIn
  // ------------------------------------------------------------------
  describe('signIn', () => {
    it('should POST /api/auth/signin with credentials, save token, return data on success', async () => {
      const apiResponse = {
        success: true,
        admin: { id: 1, email: 'admin@test.com', full_name: 'Admin User' },
        tenant: { id: 1, name: 'Test Cafe', subdomain: 'test-cafe' },
        sessionToken: 'session-token-abc-123'
      }
      mockFetchSuccess(apiResponse)

      const result = await authService.signIn('admin@test.com', 'correct-password')

      expect(fetch).toHaveBeenCalledWith('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'correct-password' })
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('tappmesa-session', 'session-token-abc-123')
      expect(result).toEqual(apiResponse)
    })

    it('should return { success: false, error } on 401 and NOT touch localStorage', async () => {
      mockFetchError(401, 'Email o contraseña incorrectos')

      const result = await authService.signIn('wrong@test.com', 'bad-password')

      expect(fetch).toHaveBeenCalledWith('/api/auth/signin', expect.any(Object))
      expect(localStorage.setItem).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: false,
        error: 'Email o contraseña incorrectos'
      })
    })

    it('should return connection error message on network failure', async () => {
      mockFetchNetworkError()

      const result = await authService.signIn('any@test.com', 'any-password')

      expect(result).toEqual({
        success: false,
        error: 'Error de conexión. Intenta nuevamente.'
      })
    })
  })

  // ------------------------------------------------------------------
  // T3: signUp
  // ------------------------------------------------------------------
  describe('signUp', () => {
    it('should POST /api/auth/signup with userData, save token, return full response on 201', async () => {
      const apiResponse = {
        success: true,
        tenant: { id: 2, name: 'New Cafe', subdomain: 'new-cafe' },
        admin: { id: 2, email: 'owner@test.com' },
        sessionToken: 'new-session-token-456',
        trialInfo: { endDate: '2024-03-01T00:00:00Z', daysLeft: 60, isExpired: false, isExpiring: false }
      }
      mockFetchSuccess(apiResponse)

      const userData = {
        email: 'owner@test.com',
        password: 'secure-password',
        ownerName: 'Owner Name',
        restaurantName: 'New Cafe',
        phone: '+56912345678'
      }

      const result = await authService.signUp(userData)

      expect(fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('tappmesa-session', 'new-session-token-456')
      expect(result).toEqual(apiResponse)
    })

    it('should return { success: false, error } on 400 duplicate email and NOT touch localStorage', async () => {
      mockFetchError(400, 'El email ya está registrado')

      const result = await authService.signUp({
        email: 'existing@test.com',
        password: 'password',
        ownerName: 'Owner',
        restaurantName: 'Cafe'
      })

      expect(fetch).toHaveBeenCalledWith('/api/auth/signup', expect.any(Object))
      expect(localStorage.setItem).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: false,
        error: 'El email ya está registrado'
      })
    })
  })

  // ------------------------------------------------------------------
  // T4: getCurrentSession
  // ------------------------------------------------------------------
  describe('getCurrentSession', () => {
    it('should return null without fetching when no token in localStorage', async () => {
      localStorage.getItem.mockReturnValue(null)

      const result = await authService.getCurrentSession()

      expect(fetch).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should GET /api/auth/session with Bearer token and return session data on 200', async () => {
      localStorage.getItem.mockReturnValue('valid-token-xyz')
      const apiResponse = {
        admin: { id: 1, email: 'admin@test.com' },
        tenant: { id: 1, name: 'Test Cafe' },
        sessionToken: 'valid-token-xyz'
      }
      mockFetchSuccess(apiResponse)

      const result = await authService.getCurrentSession()

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token-xyz',
          'Content-Type': 'application/json'
        }
      })
      expect(result).toEqual(apiResponse)
    })

    it('should remove token and return null when API responds 401 (expired/invalid)', async () => {
      localStorage.getItem.mockReturnValue('expired-token')
      mockFetchError(401, 'Sesión expirada')

      const result = await authService.getCurrentSession()

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', expect.any(Object))
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-session')
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-jwt')
      expect(result).toBeNull()
    })

    it('C5: NO borra localStorage en 5xx (error transitorio del server)', async () => {
      localStorage.getItem.mockReturnValue('valid-token-xyz')
      mockFetchError(500, 'Internal Server Error')

      const result = await authService.getCurrentSession()

      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('C5: NO borra localStorage en error de red', async () => {
      localStorage.getItem.mockReturnValue('valid-token-xyz')
      mockFetchNetworkError()

      const result = await authService.getCurrentSession()

      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('C5: adjunta JWT inline (tappmesa-jwt) cuando la respuesta trae token', async () => {
      localStorage.getItem.mockReturnValue('valid-token-xyz')
      mockFetchSuccess({
        admin: { id: 1, email: 'admin@test.com' },
        tenant: { id: 1 },
        token: 'jwt-abc-123'
      })

      const result = await authService.getCurrentSession()

      expect(localStorage.setItem).toHaveBeenCalledWith('tappmesa-jwt', 'jwt-abc-123')
      expect(result.token).toBe('jwt-abc-123')
    })
  })

  // ------------------------------------------------------------------
  // T4b: refreshJwt (C5)
  // ------------------------------------------------------------------
  describe('refreshJwt', () => {
    it('should POST /api/auth/token with Bearer session and store tappmesa-jwt on success', async () => {
      localStorage.getItem.mockReturnValue('session-token-abc')
      mockFetchSuccess({ token: 'jwt-refreshed-123', expires_at: '2099-01-01T00:00:00Z' })

      const result = await authService.refreshJwt()

      expect(fetch).toHaveBeenCalledWith('/api/auth/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer session-token-abc',
          'Content-Type': 'application/json'
        }
      })
      expect(localStorage.setItem).toHaveBeenCalledWith('tappmesa-jwt', 'jwt-refreshed-123')
      expect(result.token).toBe('jwt-refreshed-123')
    })

    it('should return null without fetching when no session token', async () => {
      localStorage.getItem.mockReturnValue(null)

      const result = await authService.refreshJwt()

      expect(fetch).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    it('should clear session+jwt on 401 and return null', async () => {
      localStorage.getItem.mockReturnValue('expired-session')
      mockFetchError(401, 'No autorizado')

      const result = await authService.refreshJwt()

      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-session')
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-jwt')
      expect(result).toBeNull()
    })

    it('C5: NO borra localStorage en error de red', async () => {
      localStorage.getItem.mockReturnValue('valid-session')
      mockFetchNetworkError()

      const result = await authService.refreshJwt()

      expect(localStorage.removeItem).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  // ------------------------------------------------------------------
  // T5: signOut
  // ------------------------------------------------------------------
  describe('signOut', () => {
    it('should POST /api/auth/signout with Bearer token and always clear localStorage', async () => {
      localStorage.getItem.mockReturnValue('logout-token')
      mockFetchSuccess({ success: true })

      const result = await authService.signOut()

      expect(fetch).toHaveBeenCalledWith('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer logout-token',
          'Content-Type': 'application/json'
        }
      })
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-session')
      expect(result).toEqual({ success: true })
    })

    it('should clear localStorage and return success without fetch when no token exists', async () => {
      localStorage.getItem.mockReturnValue(null)

      const result = await authService.signOut()

      expect(fetch).not.toHaveBeenCalled()
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-session')
      expect(result).toEqual({ success: true })
    })

    it('should clear localStorage and return success even when fetch fails (network error)', async () => {
      localStorage.getItem.mockReturnValue('token-for-failing-logout')
      mockFetchNetworkError()

      const result = await authService.signOut()

      expect(fetch).toHaveBeenCalledWith('/api/auth/signout', expect.any(Object))
      expect(localStorage.removeItem).toHaveBeenCalledWith('tappmesa-session')
      expect(result).toEqual({ success: true })
    })
  })

  // ------------------------------------------------------------------
  // T5: getTrialStatus (uses supabase directly, NOT fetch)
  // ------------------------------------------------------------------
  describe('getTrialStatus', () => {
    let supabaseFromSpy

    beforeEach(() => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { created_at: '2024-01-01T00:00:00Z', is_active: true },
        error: null
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      supabaseFromSpy = vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect })
    })

    afterEach(() => {
      supabaseFromSpy.mockRestore()
    })

    it('should query supabase directly and return trial status object', async () => {
      const result = await authService.getTrialStatus('tenant-id-123')

      expect(supabase.from).toHaveBeenCalledWith('tenants')
      expect(result).not.toBeNull()
      expect(result).toHaveProperty('endDate')
      expect(result).toHaveProperty('daysLeft')
      expect(result).toHaveProperty('isExpired')
      expect(result).toHaveProperty('isExpiring')
      expect(typeof result.daysLeft).toBe('number')
      expect(typeof result.isExpired).toBe('boolean')
      expect(typeof result.isExpiring).toBe('boolean')
    })
  })
})
