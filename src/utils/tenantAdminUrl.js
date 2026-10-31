// Admin URL of a tenant, built from the current location. On a custom domain
// the tenant label replaces the first host label (tappmesa.juancode.dev and
// cafe-tappmesa.juancode.dev both become <tenant>.juancode.dev); a bare apex
// such as juancode.dev gets the label prepended.
export function buildTenantAdminUrl({ hostname, protocol, port }, tenantSubdomain) {
  const portSuffix = port ? `:${port}` : ''

  if (hostname.endsWith('.local')) {
    return `${protocol}//${tenantSubdomain}.tappmesa.local${portSuffix}/admin`
  }
  if (hostname.endsWith('.localhost') || hostname === 'localhost' || /^\d/.test(hostname)) {
    return `${protocol}//${tenantSubdomain}.localhost${portSuffix}/admin`
  }
  if (hostname.includes('.vercel.app')) {
    return `https://${tenantSubdomain}.vercel.app/admin`
  }
  if (hostname.includes('tappmesa.com')) {
    return `https://${tenantSubdomain}.tappmesa.com/admin`
  }

  const labels = hostname.split('.')
  const baseDomain = labels.length > 2 ? labels.slice(1).join('.') : hostname
  return `${protocol}//${tenantSubdomain}.${baseDomain}${portSuffix}/admin`
}
