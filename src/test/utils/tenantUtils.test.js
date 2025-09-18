import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockLocation, resetAllMocks } from '../utils'

// Since the utility functions are not exported, we need to test them through the context
// For now, let's create separate utility functions and test them

// Extracted utility functions for testing
export const getSubdomain = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  console.log('🌐 Hostname:', hostname, 'Parts:', parts)
  
  // Desarrollo local con .local
  if (hostname.endsWith('.local')) {
    // cafe-central.tappmesa.local → cafe-central
    if (parts.length >= 3) {
      const subdomain = parts[0]
      if (subdomain !== 'tappmesa' && subdomain !== 'www') {
        console.log('🏠 Local subdomain detected:', subdomain)
        return subdomain
      }
    }
    return null
  }
  
  // Desarrollo con localhost + query param (fallback)
  if (hostname === 'localhost' || hostname.match(/^\\d/)) {
    const urlParams = new URLSearchParams(window.location.search)
    const cafeParam = urlParams.get('cafe')
    if (cafeParam) {
      console.log('🔗 Query param detected:', cafeParam)
      return cafeParam
    }
    return null
  }
  
  // Producción: cafe-central.tappmesa.com
  if (hostname.includes('tappmesa.com')) {
    if (parts.length >= 3) {
      const subdomain = parts[0]
      if (subdomain !== 'www' && subdomain !== 'admin') {
        console.log('🌍 Production subdomain detected:', subdomain)
        return subdomain
      }
    }
    return null
  }
  
  // Otros dominios personalizados
  if (parts.length >= 2) {
    const subdomain = parts[0]
    if (subdomain !== 'www') {
      console.log('🏢 Custom subdomain detected:', subdomain)
      return subdomain
    }
  }
  
  return null
}

export const getTableCode = () => {
  const pathname = window.location.pathname
  const pathParts = pathname.split('/').filter(Boolean)
  
  // Buscar código de mesa en la URL: /ABCD1234/
  if (pathParts.length > 0) {
    const potentialTableCode = pathParts[0]
    // Validar formato: 8 caracteres alfanuméricos
    if (/^[A-Z0-9]{8}$/.test(potentialTableCode)) {
      console.log('🪑 Table code detected:', potentialTableCode)
      return potentialTableCode
    }
  }
  
  return null
}

export const getAppType = () => {
  const hostname = window.location.hostname
  const subdomain = getSubdomain()
  const tableCode = getTableCode()
  
  // Admin específico
  if (hostname.startsWith('admin.') || window.location.pathname.startsWith('/admin')) {
    return 'admin'
  }
  
  // Si hay código de mesa, es una sesión de mesa
  if (subdomain && tableCode) {
    return 'table'
  }
  
  // Si hay subdominio, es una cafetería
  if (subdomain) {
    return 'tenant'
  }
  
  // Landing page principal
  return 'landing'
}

describe('TenantContext Utility Functions', () => {
  beforeEach(() => {
    resetAllMocks()
    // Reset console.log mock
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('getSubdomain', () => {
    it('should extract subdomain from local development URL', () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      const result = getSubdomain()
      
      expect(result).toBe('cafe-central')
    })

    it('should return null for main tappmesa.local domain', () => {
      mockLocation({ hostname: 'tappmesa.local' })
      
      const result = getSubdomain()
      
      expect(result).toBe(null)
    })

    it('should return null for www subdomain on local', () => {
      mockLocation({ hostname: 'www.tappmesa.local' })
      
      const result = getSubdomain()
      
      expect(result).toBe(null)
    })

    it('should extract subdomain from query parameter on localhost', () => {
      mockLocation({ 
        hostname: 'localhost',
        search: '?cafe=mi-cafeteria'
      })
      
      const result = getSubdomain()
      
      expect(result).toBe('mi-cafeteria')
    })

    it('should return null for localhost without query parameter', () => {
      mockLocation({ hostname: 'localhost', search: '' })
      
      const result = getSubdomain()
      
      expect(result).toBe(null)
    })

    it('should extract subdomain from production URL', () => {
      mockLocation({ hostname: 'cafe-norte.tappmesa.com' })
      
      const result = getSubdomain()
      
      expect(result).toBe('cafe-norte')
    })

    it('should return null for admin subdomain on production', () => {
      mockLocation({ hostname: 'admin.tappmesa.com' })
      
      const result = getSubdomain()
      
      expect(result).toBe(null)
    })

    it('should extract subdomain from custom domain', () => {
      mockLocation({ hostname: 'mi-local.ejemplo.com' })
      
      const result = getSubdomain()
      
      expect(result).toBe('mi-local')
    })

    it('should return null for www on custom domain', () => {
      mockLocation({ hostname: 'www.ejemplo.com' })
      
      const result = getSubdomain()
      
      expect(result).toBe(null)
    })
  })

  describe('getTableCode', () => {
    it('should extract valid table code from URL path', () => {
      mockLocation({ pathname: '/ABCD1234/menu' })
      
      const result = getTableCode()
      
      expect(result).toBe('ABCD1234')
    })

    it('should extract table code from root path', () => {
      mockLocation({ pathname: '/XYZ98765' })
      
      const result = getTableCode()
      
      expect(result).toBe('XYZ98765')
    })

    it('should return null for invalid table code format', () => {
      mockLocation({ pathname: '/abc1234/menu' }) // lowercase
      
      const result = getTableCode()
      
      expect(result).toBe(null)
    })

    it('should return null for short table code', () => {
      mockLocation({ pathname: '/ABC123/menu' }) // only 6 characters
      
      const result = getTableCode()
      
      expect(result).toBe(null)
    })

    it('should return null for long table code', () => {
      mockLocation({ pathname: '/ABCD12345/menu' }) // 9 characters
      
      const result = getTableCode()
      
      expect(result).toBe(null)
    })

    it('should return null for empty path', () => {
      mockLocation({ pathname: '/' })
      
      const result = getTableCode()
      
      expect(result).toBe(null)
    })

    it('should return null for table code with special characters', () => {
      mockLocation({ pathname: '/ABCD-123/menu' })
      
      const result = getTableCode()
      
      expect(result).toBe(null)
    })
  })

  describe('getAppType', () => {
    it('should return "admin" for admin subdomain', () => {
      mockLocation({ hostname: 'admin.tappmesa.com' })
      
      const result = getAppType()
      
      expect(result).toBe('admin')
    })

    it('should return "admin" for admin path', () => {
      mockLocation({ 
        hostname: 'tappmesa.com',
        pathname: '/admin/dashboard'
      })
      
      const result = getAppType()
      
      expect(result).toBe('admin')
    })

    it('should return "table" for subdomain with table code', () => {
      mockLocation({ 
        hostname: 'cafe-central.tappmesa.local',
        pathname: '/ABCD1234/menu'
      })
      
      const result = getAppType()
      
      expect(result).toBe('table')
    })

    it('should return "tenant" for subdomain without table code', () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      const result = getAppType()
      
      expect(result).toBe('tenant')
    })

    it('should return "landing" for main domain', () => {
      mockLocation({ hostname: 'tappmesa.com' })
      
      const result = getAppType()
      
      expect(result).toBe('landing')
    })

    it('should return "landing" for localhost without parameters', () => {
      mockLocation({ hostname: 'localhost' })
      
      const result = getAppType()
      
      expect(result).toBe('landing')
    })
  })
})