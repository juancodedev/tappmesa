import { vi } from 'vitest'

// Mock Supabase client
export const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
})

// Mock tenant data
export const mockTenant = {
  id: 1,
  name: 'Café Central',
  subdomain: 'cafe-central',
  primary_color: '#dc2626',
  secondary_color: '#f97316',
  is_active: true,
}

// Mock table data
export const mockTable = {
  id: 1,
  tenant_id: 1,
  number: 5,
  unique_code: 'ABCD1234',
  is_active: true,
}

// Mock table session
export const mockTableSession = {
  id: 1,
  tenant_id: 1,
  table_id: 1,
  session_code: 'ABCD1234-ABC123',
  status: 'active',
  started_at: '2023-01-01T10:00:00Z',
}

// Mock product data
export const mockProduct = {
  id: 1,
  name: 'Cappuccino',
  price: 3500,
  description: 'Delicioso cappuccino con espuma de leche',
  category: 'Bebidas Calientes',
  image_url: '/images/cappuccino.jpg',
  is_available: true,
}

// Helper to render components with providers
export const renderWithProviders = (component, options = {}) => {
  const {
    tenantValue = {},
    cartValue = {},
    initialLocation = '/',
  } = options

  // Mock window.location for the test
  window.location.pathname = initialLocation

  const AllProviders = ({ children }) => {
    return children // We'll wrap with actual providers in the tests
  }

  // Note: render function should be imported from @testing-library/react in the actual test files
  return { AllProviders }
}

// Helper to create mock functions with specific return values
export const createMockFunction = (returnValue) => vi.fn(() => returnValue)

// Helper to mock window.location properties
export const mockLocation = (overrides = {}) => {
  const defaultLocation = {
    hostname: 'localhost',
    pathname: '/',
    search: '',
    href: 'http://localhost:5173/',
    origin: 'http://localhost:5173',
    reload: vi.fn(),
  }

  Object.assign(window.location, { ...defaultLocation, ...overrides })
}

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks()
  localStorage.getItem.mockClear()
  localStorage.setItem.mockClear()
  localStorage.removeItem.mockClear()
  localStorage.clear.mockClear()
}