import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock window.location methods
delete window.location
window.location = {
  hostname: 'localhost',
  pathname: '/',
  search: '',
  href: 'http://localhost:5173/',
  origin: 'http://localhost:5173',
  reload: vi.fn(),
}

// Mock localStorage funcional (almacena datos reales)
const createMockStorage = () => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value) }),
    removeItem: vi.fn((key) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
    _store: store, // exposición para debugging en tests
  }
}
Object.defineProperty(window, 'localStorage', {
  value: createMockStorage(),
  writable: true,
})

// Mock Supabase environment variables
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

// Mock document methods
Object.defineProperty(document, 'title', {
  set: vi.fn(),
  get: vi.fn(() => 'Tappmesa Test'),
})

Object.defineProperty(document.documentElement.style, 'setProperty', {
  value: vi.fn(),
  writable: true,
})