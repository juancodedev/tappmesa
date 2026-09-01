import { describe, it, expect } from 'vitest'
import { resolveSubdomain } from '../../../lib/utils/hostResolver.js'

describe('resolveSubdomain (takeout Host resolution)', () => {
  it('resolves Vercel tenant format [name]-tappmesa.vercel.app', () => {
    expect(resolveSubdomain('teteria-luna-tappmesa.vercel.app')).toBe('teteria-luna-tappmesa')
  })

  it('resolves custom domain *.tappmesa.com', () => {
    expect(resolveSubdomain('cafe-x.tappmesa.com')).toBe('cafe-x')
  })

  it('resolves single-label .localhost for local dev', () => {
    expect(resolveSubdomain('teteria-luna-tappmesa.localhost')).toBe('teteria-luna-tappmesa')
  })

  it('strips the port before resolving', () => {
    expect(resolveSubdomain('cafe-central-tappmesa.localhost:5173')).toBe('cafe-central-tappmesa')
  })

  it('supports legacy .local suffix', () => {
    expect(resolveSubdomain('cafe-central.local')).toBe('cafe-central')
  })

  it('returns null for bare localhost (landing)', () => {
    expect(resolveSubdomain('localhost')).toBeNull()
    expect(resolveSubdomain('localhost:5173')).toBeNull()
  })

  it('returns null for www and unknown custom domains', () => {
    expect(resolveSubdomain('www.tappmesa.com')).toBeNull()
    expect(resolveSubdomain('store.example.com')).toBeNull()
  })

  it('returns null when no Host header is present', () => {
    expect(resolveSubdomain(null)).toBeNull()
    expect(resolveSubdomain('')).toBeNull()
  })
})