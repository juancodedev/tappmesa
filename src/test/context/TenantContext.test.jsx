import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor} from '@testing-library/react'
import { TenantProvider } from '../../context/TenantContext'
import { useTenant } from '../../hooks/useTenant'
import { useIsTenant, useTenantUrl } from '../../hooks/useTenantHooks'
import { createMockSupabase, mockTenant, mockTable, mockTableSession, mockLocation, resetAllMocks } from '../utils'

// Mock the supabase import
vi.mock('../../lib/supabase', () => ({
  supabase: createMockSupabase()
}))

// Test component to access context values
const TestComponent = ({ testType = 'basic' }) => {
  const context = useTenant()
  const isTenant = useIsTenant()
  const tenantUrl = useTenantUrl()
  
  if (testType === 'basic') {
    return (
      <div data-testid="tenant-info">
        <div data-testid="loading">{context.loading ? 'loading' : 'not-loading'}</div>
        <div data-testid="app-type">{context.appType}</div>
        <div data-testid="subdomain">{context.subdomain || 'no-subdomain'}</div>
        <div data-testid="table-code">{context.tableCode || 'no-table-code'}</div>
        <div data-testid="tenant-name">{context.tenant?.name || 'no-tenant'}</div>
        <div data-testid="error">{context.error || 'no-error'}</div>
      </div>
    )
  }
  
  if (testType === 'hooks') {
    return (
      <div data-testid="hooks-info">
        <div data-testid="is-tenant">{isTenant ? 'true' : 'false'}</div>
        <div data-testid="tenant-url">{tenantUrl || 'no-url'}</div>
      </div>
    )
  }
  
  return null
}

// Test component that throws error when used outside provider
const TestComponentOutsideProvider = () => {
  const context = useTenant()
  return <div>{context.tenant}</div>
}

describe('TenantContext', () => {
  let mockSupabase

  beforeEach(() => {
    resetAllMocks()
    mockSupabase = createMockSupabase()
    // Reset document properties
    document.title = 'Tappmesa Test'
    document.documentElement.style.setProperty = vi.fn()
  })

  describe('TenantProvider', () => {
    it('should provide default context values', async () => {
      mockLocation({ hostname: 'localhost' })
      
      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      expect(screen.getByTestId('app-type')).toHaveTextContent('landing')
      expect(screen.getByTestId('subdomain')).toHaveTextContent('no-subdomain')
      expect(screen.getByTestId('table-code')).toHaveTextContent('no-table-code')
    })

    it('should detect local subdomain', async () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      // Mock successful tenant fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      })

      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('app-type')).toHaveTextContent('tenant')
        expect(screen.getByTestId('subdomain')).toHaveTextContent('cafe-central')
        expect(screen.getByTestId('tenant-name')).toHaveTextContent('Café Central')
      })
    })

    it('should detect admin app type', async () => {
      mockLocation({ hostname: 'admin.tappmesa.com' })
      
      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('app-type')).toHaveTextContent('admin')
      })
    })

    it('should detect table app type with subdomain and table code', async () => {
      mockLocation({ 
        hostname: 'cafe-central.tappmesa.local',
        pathname: '/ABCD1234/menu'
      })
      
      // Mock successful tenant and table fetch
      const mockTenantQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      }
      
      const mockTableQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTable, error: null })
      }

      const mockSessionQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        insert: vi.fn().mockReturnThis(),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockTenantQuery)
        .mockReturnValueOnce(mockTableQuery)
        .mockReturnValueOnce(mockSessionQuery)
        .mockReturnValueOnce({
          ...mockSessionQuery,
          single: vi.fn().mockResolvedValue({ data: mockTableSession, error: null })
        })

      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('app-type')).toHaveTextContent('table')
        expect(screen.getByTestId('subdomain')).toHaveTextContent('cafe-central')
        expect(screen.getByTestId('table-code')).toHaveTextContent('ABCD1234')
      })
    })

    it('should handle tenant not found error', async () => {
      mockLocation({ hostname: 'nonexistent.tappmesa.local' })
      
      // Mock tenant not found
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      })

      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Cafetería "nonexistent" no encontrada')
      })
    })

    it('should apply tenant branding', async () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      })

      render(
        <TenantProvider>
          <TestComponent />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(document.title).toBe('Café Central - Tappmesa')
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--primary-color', '#dc2626')
        expect(document.documentElement.style.setProperty).toHaveBeenCalledWith('--secondary-color', '#f97316')
      })
    })
  })

  describe('useTenant hook', () => {
    it('should throw error when used outside provider', () => {
      // Mock console.error to prevent test output pollution
      const originalError = console.error
      console.error = vi.fn()
      
      expect(() => {
        render(<TestComponentOutsideProvider />)
      }).toThrow('useTenant must be used within TenantProvider')
      
      console.error = originalError
    })
  })

  describe('useIsTenant hook', () => {
    it('should return true for tenant app with loaded tenant', async () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      })

      render(
        <TenantProvider>
          <TestComponent testType="hooks" />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-tenant')).toHaveTextContent('true')
      })
    })

    it('should return false for non-tenant app types', async () => {
      mockLocation({ hostname: 'admin.tappmesa.com' })

      render(
        <TenantProvider>
          <TestComponent testType="hooks" />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('is-tenant')).toHaveTextContent('false')
      })
    })
  })

  describe('useTenantUrl hook', () => {
    it('should generate local development URL', async () => {
      mockLocation({ hostname: 'cafe-central.tappmesa.local' })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      })

      render(
        <TenantProvider>
          <TestComponent testType="hooks" />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tenant-url')).toHaveTextContent('http://cafe-central.tappmesa.local:5173')
      })
    })

    it('should generate localhost URL with query parameter', async () => {
      mockLocation({ hostname: 'localhost' })
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockTenant, error: null })
      })

      render(
        <TenantProvider>
          <TestComponent testType="hooks" />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tenant-url')).toHaveTextContent('http://localhost:5173?cafe=cafe-central')
      })
    })

    it('should return null when no tenant is loaded', async () => {
      mockLocation({ hostname: 'localhost' })

      render(
        <TenantProvider>
          <TestComponent testType="hooks" />
        </TenantProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('tenant-url')).toHaveTextContent('no-url')
      })
    })
  })
})