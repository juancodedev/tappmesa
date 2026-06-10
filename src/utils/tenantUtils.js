/**
 * Tenant utility functions
 *
 * Funciones puras para determinar subdominio, código de mesa y tipo de app.
 * Extraídas de TenantContext.jsx para poder testearlas directamente.
 */

// Función para extraer subdominio del hostname
export const getSubdomain = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // Desarrollo local con .local o .localhost
  if (hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
    // cafe-central.tappmesa.local → cafe-central
    // teteria-luna.localhost → teteria-luna
    if (parts.length >= 2) {
      const subdomain = parts[0]
      if (subdomain !== 'tappmesa' && subdomain !== 'www' && subdomain !== 'localhost') {
        return subdomain
      }
    }
    return null
  }

  // Desarrollo con localhost + query param (fallback)
  if (hostname === 'localhost' || hostname.match(/^\d/)) {
    const urlParams = new URLSearchParams(window.location.search)
    const cafeParam = urlParams.get('cafe')
    if (cafeParam) {
      return cafeParam
    }
    return null
  }

  // Producción: cafe-central.tappmesa.com
  if (hostname.includes('tappmesa.com')) {
    if (parts.length >= 3) {
      const subdomain = parts[0]
      // Excluir subdominios especiales del sistema
      if (!['www', 'admin', 'api', 'app', 'mail', 'ftp'].includes(subdomain)) {
        return subdomain
      }
    }
    return null
  }

  // Producción con Vercel: teteria-luna-tappmesa.vercel.app
  if (hostname.includes('tappmesa.vercel.app')) {
    if (parts.length >= 3) {
      const fullSubdomain = parts[0] // ej: "teteria-luna-tappmesa"

      // Verificar si termina con -tappmesa (nuevo formato)
      if (fullSubdomain.includes('-tappmesa')) {
        // Usar el nombre completo incluyendo -tappmesa para matching con DB
        if (!['www-tappmesa', 'admin-tappmesa', 'api-tappmesa', 'app-tappmesa'].includes(fullSubdomain)) {
          return fullSubdomain
        }
      }
    }

    // Formato legacy: teteria-luna.tappmesa.vercel.app (por compatibilidad)
    if (parts.length >= 4) {
      const subdomain = parts[0]
      if (!['www', 'admin', 'api', 'app'].includes(subdomain)) {
        return subdomain
      }
    }

    return null
  }

  // Dominios personalizados (e.g., cafeteria1.midominio.com)
  if (parts.length >= 2) {
    const subdomain = parts[0]
    // Solo considerar como subdomain si no es www y no es el dominio base
    if (subdomain !== 'www' && parts.length > 2) {
      return subdomain
    }
  }

  return null
}

// Función para extraer código de mesa de la URL
export const getTableCode = () => {
  const pathname = window.location.pathname
  const pathParts = pathname.split('/').filter(Boolean)

  // 1. Primero buscar en query param (para desarrollo con localhost)
  const urlParams = new URLSearchParams(window.location.search)
  const tableParam = urlParams.get('table')

  if (tableParam) {
    // Validar formato del código de mesa del query param
    const isNewFormat = /^[A-Z0-9]{8,12}$/.test(tableParam)
    const isOldFormat = /^[a-z0-9-]+-mesa-\d+$/.test(tableParam)

    if (isNewFormat || isOldFormat) {
      return tableParam
    }
  }

  // 2. Buscar código de mesa en el pathname
  if (pathParts.length > 0) {
    const potentialTableCode = pathParts[0]

    // Validar formatos soportados:
    // 1. Formato nuevo: 8-12 caracteres alfanuméricos mayúsculas (ABCD12345678)
    // 2. Formato antiguo: tenant-slug-mesa-N (coffee-co-mesa-1)
    const isNewFormat = /^[A-Z0-9]{8,12}$/.test(potentialTableCode)
    const isOldFormat = /^[a-z0-9-]+-mesa-\d+$/.test(potentialTableCode)

    if (isNewFormat || isOldFormat) {
      return potentialTableCode
    }
  }

  return null
}

// Función para determinar el tipo de aplicación
export const getAppType = () => {
  const hostname = window.location.hostname
  const pathname = window.location.pathname
  const subdomain = getSubdomain()
  const tableCode = getTableCode()

  // Si hay código de mesa, es una sesión de mesa
  if (subdomain && tableCode) {
    return 'table'
  }

  // Admin: diferenciar entre super admin global y admin de tenant
  if (pathname.startsWith('/admin') || hostname.startsWith('admin.')) {
    // Si NO hay subdomain, es super admin global
    if (!subdomain) {
      return 'admin'
    }
    // Si HAY subdomain, es el admin específico de ese tenant
    return 'tenant'
  }

  // Si hay subdominio, es una cafetería
  if (subdomain) {
    return 'tenant'
  }

  // Landing page principal
  return 'landing'
}
