import { useTenant } from '../hooks/useTenant'

// Hook para detectar si estamos en un tenant
export const useIsTenant = () => {
  const { appType, tenant } = useTenant()
  return appType === 'tenant' && !!tenant
}

// Hook para obtener la URL base del tenant
export const useTenantUrl = () => {
  const { tenant } = useTenant()
  console.log('tenant', tenant)
  
  if (!tenant) return null
  
  // Generar URL base del tenant usando el slug
  const hostname = window.location.hostname
  
  if (hostname.endsWith('.local')) {
    return `http://${tenant.slug}.tappmesa.local:5173`  // ✅ Usando slug
  }

  if (hostname.endsWith('.localhost')) {
    return `http://${tenant.slug}.localhost:5173`  // ✅ Usando slug con localhost
  }

  if (hostname.includes('localhost')) {
    return `http://${tenant.slug}.localhost:5173`  // ✅ Usando slug con subdominio localhost
  }

  if (hostname.includes('tappmesa.com')) {
    return `https://${tenant.slug}.tappmesa.com`  // ✅ Usando slug
  }

  if (hostname.includes('vercel.app')) {
    return `https://${tenant.slug}.tappmesa.vercel.app`  // ✅ Usando slug
  }

  return `https://${tenant.slug}.tappmesa.com`  // ✅ Fallback
}
