import { describe, it, expect, afterEach } from 'vitest'
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

  describe('TENANT_BASE_DOMAINS (custom base domains)', () => {
    afterEach(() => {
      delete process.env.TENANT_BASE_DOMAINS
    })

    it('resolves <tenant>.<base> for a configured base domain', () => {
      process.env.TENANT_BASE_DOMAINS = 'juancode.dev'
      expect(resolveSubdomain('bistro-sunrise-tappmesa.juancode.dev')).toBe('bistro-sunrise-tappmesa')
    })

    it('accepts a comma-separated list with spaces and mixed case', () => {
      process.env.TENANT_BASE_DOMAINS = ' Juancode.dev , cafes.cl '
      expect(resolveSubdomain('cafe-x.cafes.cl:443')).toBe('cafe-x')
      expect(resolveSubdomain('BISTRO.JUANCODE.DEV')).toBe('bistro')
    })

    it('ignores the bare base domain, www and multi-level prefixes', () => {
      process.env.TENANT_BASE_DOMAINS = 'juancode.dev'
      expect(resolveSubdomain('juancode.dev')).toBeNull()
      expect(resolveSubdomain('www.juancode.dev')).toBeNull()
      expect(resolveSubdomain('a.b.juancode.dev')).toBeNull()
    })

    it('does not match a domain that only ends with the same text', () => {
      process.env.TENANT_BASE_DOMAINS = 'juancode.dev'
      expect(resolveSubdomain('cafe.evil-juancode.dev')).toBeNull()
    })

    it('keeps unknown custom domains unresolved when not configured', () => {
      expect(resolveSubdomain('bistro-sunrise-tappmesa.juancode.dev')).toBeNull()
    })
  })
})
