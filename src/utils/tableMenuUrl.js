// Builds the public menu URL encoded in a table's QR code.
// `location` is { hostname, protocol, port } (window.location in the browser).
export const buildTableMenuUrl = ({ hostname, protocol, port }, tenantSlug, uniqueCode) => {
  const portSuffix = port ? ':' + port : ''
  const path = `/${uniqueCode}/menu`

  // Local development with .localhost (recommended)
  if (hostname.endsWith('.localhost')) {
    if (hostname.startsWith(tenantSlug)) {
      return `${protocol}//${hostname}${portSuffix}${path}`
    }
    return `http://${tenantSlug}.localhost${portSuffix}${path}`
  }

  // Local development with .local
  if (hostname.endsWith('.local')) {
    if (hostname.startsWith(tenantSlug)) {
      return `${protocol}//${hostname}${portSuffix}${path}`
    }
    return `http://${tenantSlug}.tappmesa.local${portSuffix}${path}`
  }

  // Plain localhost or IP: query param fallback
  if (hostname === 'localhost' || hostname.match(/^\d/)) {
    return `${protocol}//${hostname}${portSuffix}?cafe=${tenantSlug}&table=${uniqueCode}`
  }

  // Vercel: [name]-tappmesa.vercel.app
  if (hostname.includes('.vercel.app')) {
    if (hostname.startsWith(tenantSlug)) {
      return `${protocol}//${hostname}${path}`
    }
    return `${protocol}//${tenantSlug}.vercel.app${path}`
  }

  // Custom domain tappmesa.com
  if (hostname.includes('tappmesa.com')) {
    if (hostname.startsWith(tenantSlug)) {
      return `${protocol}//${hostname}${path}`
    }
    return `https://${tenantSlug}.tappmesa.com${path}`
  }

  // Other custom domains: same rule as getSubdomain() — with more than two
  // labels the first one is a subdomain (e.g. the admin host), so the tenant
  // replaces it instead of being nested under it.
  if (hostname.startsWith(tenantSlug)) {
    return `${protocol}//${hostname}${path}`
  }
  const labels = hostname.split('.')
  const baseDomain = labels.length > 2 ? labels.slice(1).join('.') : hostname
  return `${protocol}//${tenantSlug}.${baseDomain}${path}`
}
