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

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
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