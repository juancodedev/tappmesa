import { describe, it, expect, beforeEach } from 'vitest'
import { mockLocation, resetAllMocks } from '../utils'
import { getSubdomain, getTableCode, getAppType } from '../../utils/tenantUtils'

describe('getSubdomain', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('local development (.local)', () => {
    it('should extract subdomain from local URL', () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      expect(getSubdomain()).toBe('cafe-central')
    })

    it('should return null for main tappmesa.local', () => {
      mockLocation({ hostname: 'tappmesa.local' })
      expect(getSubdomain()).toBeNull()
    })

    it('should return null for www subdomain on local', () => {
      mockLocation({ hostname: 'www.tappmesa.local' })
      expect(getSubdomain()).toBeNull()
    })
  })

  describe('local development (.localhost)', () => {
    it('should extract subdomain from .localhost domain', () => {
      mockLocation({ hostname: 'teteria-luna.localhost' })
      expect(getSubdomain()).toBe('teteria-luna')
    })

    it('should extract subdomain from .localhost:5173 format', () => {
      mockLocation({ hostname: 'teteria-luna-tappmesa.localhost' })
      expect(getSubdomain()).toBe('teteria-luna-tappmesa')
    })
  })

  describe('localhost with query param', () => {
    it('should extract subdomain from query parameter', () => {
      mockLocation({ hostname: 'localhost', search: '?cafe=mi-cafeteria' })
      expect(getSubdomain()).toBe('mi-cafeteria')
    })

    it('should return null for localhost without query param', () => {
      mockLocation({ hostname: 'localhost', search: '' })
      expect(getSubdomain()).toBeNull()
    })
  })

  describe('production (tappmesa.com)', () => {
    it('should extract subdomain from production URL', () => {
      mockLocation({ hostname: 'cafe-norte.tappmesa.com' })
      expect(getSubdomain()).toBe('cafe-norte')
    })

    it('should return null for admin subdomain', () => {
      mockLocation({ hostname: 'admin.tappmesa.com' })
      expect(getSubdomain()).toBeNull()
    })

    it('should return null for api subdomain', () => {
      mockLocation({ hostname: 'api.tappmesa.com' })
      expect(getSubdomain()).toBeNull()
    })
  })

  describe('Vercel deployment (tappmesa.vercel.app)', () => {
    it('should extract subdomain from new Vercel format (name-tappmesa.vercel.app)', () => {
      mockLocation({ hostname: 'teteria-luna-tappmesa.vercel.app' })
      expect(getSubdomain()).toBe('teteria-luna-tappmesa')
    })

    it('should extract subdomain from legacy Vercel format', () => {
      mockLocation({ hostname: 'teteria-luna.tappmesa.vercel.app' })
      expect(getSubdomain()).toBe('teteria-luna')
    })

    it('should return null for admin Vercel subdomain', () => {
      mockLocation({ hostname: 'admin-tappmesa.vercel.app' })
      expect(getSubdomain()).toBeNull()
    })

    it('should return null for www Vercel subdomain', () => {
      mockLocation({ hostname: 'www-tappmesa.vercel.app' })
      expect(getSubdomain()).toBeNull()
    })
  })

  describe('custom domains', () => {
    it('should extract subdomain from custom domain', () => {
      mockLocation({ hostname: 'mi-local.ejemplo.com' })
      expect(getSubdomain()).toBe('mi-local')
    })

    it('should return null for www on custom domain', () => {
      mockLocation({ hostname: 'www.ejemplo.com' })
      expect(getSubdomain()).toBeNull()
    })

    it('should return null for bare domain without subdomain', () => {
      mockLocation({ hostname: 'midominio.com' })
      expect(getSubdomain()).toBeNull()
    })
  })
})

describe('getTableCode', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('pathname detection', () => {
    it('should extract valid 8-char table code from URL path', () => {
      mockLocation({ pathname: '/ABCD1234/menu' })
      expect(getTableCode()).toBe('ABCD1234')
    })

    it('should extract valid 12-char table code', () => {
      mockLocation({ pathname: '/ABCD1234EFGH/menu' })
      expect(getTableCode()).toBe('ABCD1234EFGH')
    })

    it('should extract table code from root path', () => {
      mockLocation({ pathname: '/XYZ98765' })
      expect(getTableCode()).toBe('XYZ98765')
    })

    it('should detect old-format table code (tenant-slug-mesa-N)', () => {
      mockLocation({ pathname: '/coffee-co-mesa-1/menu' })
      expect(getTableCode()).toBe('coffee-co-mesa-1')
    })

    it('should return null for invalid format (lowercase)', () => {
      mockLocation({ pathname: '/abc1234/menu' })
      expect(getTableCode()).toBeNull()
    })

    it('should return null for short code (7 chars)', () => {
      mockLocation({ pathname: '/ABC1234/menu' })
      expect(getTableCode()).toBeNull()
    })

    it('should return null for long code (13 chars)', () => {
      mockLocation({ pathname: '/ABCD1234EFGHJ/menu' })
      expect(getTableCode()).toBeNull()
    })

    it('should return null for empty path', () => {
      mockLocation({ pathname: '/' })
      expect(getTableCode()).toBeNull()
    })

    it('should return null for code with special characters', () => {
      mockLocation({ pathname: '/ABCD-123/menu' })
      expect(getTableCode()).toBeNull()
    })
  })

  describe('query param detection', () => {
    it('should extract table code from ?table= query param', () => {
      mockLocation({ pathname: '/menu', search: '?table=ABCD1234' })
      expect(getTableCode()).toBe('ABCD1234')
    })

    it('should prefer query param over pathname', () => {
      mockLocation({ pathname: '/XYZ98765/menu', search: '?table=ABCD1234' })
      expect(getTableCode()).toBe('ABCD1234')
    })
  })
})

describe('getAppType', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return "table" for subdomain with table code', () => {
    mockLocation({ hostname: 'cafe-central.tappmesa.local', pathname: '/ABCD1234/menu' })
    expect(getAppType()).toBe('table')
  })

  it('should return "admin" for admin subdomain without tenant', () => {
    mockLocation({ hostname: 'admin.tappmesa.com' })
    expect(getAppType()).toBe('admin')
  })

  it('should return "admin" for /admin path without subdomain', () => {
    mockLocation({ hostname: 'tappmesa.com', pathname: '/admin/dashboard' })
    expect(getAppType()).toBe('admin')
  })

  it('should return "tenant" for /admin path with subdomain', () => {
    mockLocation({ hostname: 'cafe-norte.tappmesa.com', pathname: '/admin' })
    expect(getAppType()).toBe('tenant')
  })

  it('should return "tenant" for subdomain without table code', () => {
    mockLocation({ hostname: 'cafe-central.tappmesa.local' })
    expect(getAppType()).toBe('tenant')
  })

  it('should return "landing" for main domain', () => {
    mockLocation({ hostname: 'tappmesa.com' })
    expect(getAppType()).toBe('landing')
  })

  it('should return "landing" for localhost without parameters', () => {
    mockLocation({ hostname: 'localhost' })
    expect(getAppType()).toBe('landing')
  })

  it('should return "landing" for Vercel root domain', () => {
    mockLocation({ hostname: 'tappmesa.vercel.app' })
    expect(getAppType()).toBe('landing')
  })
})
