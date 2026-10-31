import { describe, it, expect } from 'vitest'
import { buildTenantAdminUrl } from '../../utils/tenantAdminUrl'

// Prod 2026-10-31: logging in on teteria-luna-tappmesa.juancode.dev built
// https://teteria-luna-tappmesa.teteria-luna-tappmesa.juancode.dev/admin. On a
// custom domain the tenant label must replace the first host label, not be
// prepended to the whole host.

const at = (hostname, protocol = 'https:', port = '') => ({ hostname, protocol, port })

describe('buildTenantAdminUrl', () => {
  it.each([
    ['tappmesa.juancode.dev', 'https://teteria-luna-tappmesa.juancode.dev/admin'],
    ['teteria-luna-tappmesa.juancode.dev', 'https://teteria-luna-tappmesa.juancode.dev/admin'],
    ['cafe-central-tappmesa.juancode.dev', 'https://teteria-luna-tappmesa.juancode.dev/admin'],
    ['juancode.dev', 'https://teteria-luna-tappmesa.juancode.dev/admin'],
  ])('on the custom domain %s points at the tenant host', (hostname, expected) => {
    expect(buildTenantAdminUrl(at(hostname), 'teteria-luna-tappmesa')).toBe(expected)
  })

  it('keeps the existing local and hosted formats', () => {
    expect(buildTenantAdminUrl(at('localhost', 'http:', '5173'), 'luna')).toBe('http://luna.localhost:5173/admin')
    expect(buildTenantAdminUrl(at('cafe.localhost', 'http:', '5173'), 'luna')).toBe('http://luna.localhost:5173/admin')
    expect(buildTenantAdminUrl(at('cafe.tappmesa.local', 'http:', ''), 'luna')).toBe('http://luna.tappmesa.local/admin')
    expect(buildTenantAdminUrl(at('tappmesa.vercel.app'), 'luna-tappmesa')).toBe('https://luna-tappmesa.vercel.app/admin')
    expect(buildTenantAdminUrl(at('tappmesa.com'), 'luna')).toBe('https://luna.tappmesa.com/admin')
  })
})
