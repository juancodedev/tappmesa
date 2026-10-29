import { describe, it, expect } from 'vitest'
import { buildTableMenuUrl } from '../../utils/tableMenuUrl'

const at = (hostname, port = '') => ({ hostname, protocol: 'https:', port })
const SLUG = 'bistro-sunrise-tappmesa'
const CODE = '7U7YA4FYEY6A'

describe('buildTableMenuUrl', () => {
  it('replaces the current subdomain on a custom domain instead of nesting it', () => {
    expect(buildTableMenuUrl(at('tappmesa.juancode.dev'), SLUG, CODE))
      .toBe('https://bistro-sunrise-tappmesa.juancode.dev/7U7YA4FYEY6A/menu')
  })

  it('prefixes the tenant on a bare custom domain', () => {
    expect(buildTableMenuUrl(at('juancode.dev'), SLUG, CODE))
      .toBe('https://bistro-sunrise-tappmesa.juancode.dev/7U7YA4FYEY6A/menu')
  })

  it('keeps the current host when already on the tenant subdomain', () => {
    expect(buildTableMenuUrl(at('bistro-sunrise-tappmesa.juancode.dev'), SLUG, CODE))
      .toBe('https://bistro-sunrise-tappmesa.juancode.dev/7U7YA4FYEY6A/menu')
  })

  it('keeps the existing Vercel, tappmesa.com and localhost formats', () => {
    expect(buildTableMenuUrl(at('tappmesa.vercel.app'), SLUG, CODE))
      .toBe('https://bistro-sunrise-tappmesa.vercel.app/7U7YA4FYEY6A/menu')
    expect(buildTableMenuUrl(at('admin.tappmesa.com'), SLUG, CODE))
      .toBe('https://bistro-sunrise-tappmesa.tappmesa.com/7U7YA4FYEY6A/menu')
    expect(buildTableMenuUrl({ hostname: 'localhost', protocol: 'http:', port: '5173' }, SLUG, CODE))
      .toBe('http://localhost:5173?cafe=bistro-sunrise-tappmesa&table=7U7YA4FYEY6A')
    expect(buildTableMenuUrl({ hostname: 'tappmesa.localhost', protocol: 'http:', port: '5173' }, SLUG, CODE))
      .toBe('http://bistro-sunrise-tappmesa.localhost:5173/7U7YA4FYEY6A/menu')
  })
})
