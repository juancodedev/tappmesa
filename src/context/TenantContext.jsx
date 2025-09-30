import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const TenantContext = createContext()

// useTenant hook moved to src/hooks/useTenant.js for Fast Refresh compatibility

// Función mejorada para extraer subdominio y mesa
const getSubdomain = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  console.log('🌐 Hostname:', hostname, 'Parts:', parts)

  // Desarrollo local con .local o .localhost
  if (hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
    // cafe-central.tappmesa.local → cafe-central
    // teteria-luna.localhost → teteria-luna
    if (parts.length >= 2) {
      const subdomain = parts[0]
      if (subdomain !== 'tappmesa' && subdomain !== 'www' && subdomain !== 'localhost') {
        console.log('🏠 Local subdomain detected:', subdomain)
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
      console.log('🔗 Query param detected:', cafeParam)
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
        console.log('🌍 Production subdomain detected:', subdomain)
        return subdomain
      }
    }
    return null
  }

  // Producción con Vercel: teteria-luna.tappmesa.vercel.app
  if (hostname.includes('tappmesa.vercel.app')) {
    if (parts.length >= 4) {
      const subdomain = parts[0]
      if (!['www', 'admin', 'api', 'app'].includes(subdomain)) {
        console.log('🚀 Vercel subdomain detected:', subdomain)
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
      console.log('🏢 Custom subdomain detected:', subdomain)
      return subdomain
    }
  }

  return null
}

// Nueva función para extraer código de mesa
const getTableCode = () => {
  const pathname = window.location.pathname
  const pathParts = pathname.split('/').filter(Boolean)
  
  // Buscar código de mesa en la URL: /ABCD1234/
  if (pathParts.length > 0) {
    const potentialTableCode = pathParts[0]
    // Validar formato: 8 caracteres alfanuméricos
    if (/^[A-Z0-9]{8}$/.test(potentialTableCode)) {
      console.log('🪑 Table code detected:', potentialTableCode)
      return potentialTableCode
    }
  }
  
  return null
}

// Función para determinar el tipo de aplicación
const getAppType = () => {
  const hostname = window.location.hostname
  const pathname = window.location.pathname
  const subdomain = getSubdomain()
  const tableCode = getTableCode()

  // Admin específico - mejorada detección para local y producción
  if (hostname.startsWith('admin.') ||
      pathname.startsWith('/admin') ||
      (hostname === 'localhost' && pathname.includes('/admin')) ||
      (hostname.includes('local') && pathname.includes('/admin'))) {
    return 'admin'
  }

  // Si hay código de mesa, es una sesión de mesa
  if (subdomain && tableCode) {
    return 'table'
  }

  // Si hay subdominio, es una cafetería
  if (subdomain) {
    return 'tenant'
  }

  // Landing page principal
  return 'landing'
}

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null)
  const [table, setTable] = useState(null)
  const [tableSession, setTableSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [appType, setAppType] = useState('landing')

  const loadTenant = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const subdomain = getSubdomain()
      const tableCode = getTableCode()
      const currentAppType = getAppType()
      setAppType(currentAppType)
      
  console.log('🔍 Loading tenant for:', { subdomain, tableCode, appType: currentAppType })
      console.log('✨ Fast Refresh test - no incompatibility expected')
      
      if (currentAppType === 'landing' || currentAppType === 'admin') {
        setTenant(null)
        setTable(null)
        setTableSession(null)
        return
      }
      
      if (!subdomain) {
        throw new Error('No se pudo identificar el local')
      }
      
      // Buscar cafetería por subdomain (para URLs como teter-a-luna-4slc2m.localhost)
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)  // Usar 'subdomain' para matching exacto
        .eq('is_active', true)
        .single()

      if (tenantError) {
        console.error('❌ Tenant not found:', tenantError)
        throw new Error(`Cafetería "${subdomain}" no encontrada`)
      }
      
      setTenant(tenantData)
      console.log('✅ Tenant loaded:', tenantData.name)
      
      // Si hay código de mesa, cargar información de la mesa
      if (tableCode && currentAppType === 'table') {
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('unique_code', tableCode)
          .eq('is_active', true)
          .single()

        if (tableError) {
          console.error('❌ Table not found:', tableError)
          throw new Error(`Mesa "${tableCode}" no encontrada`)
        }

        setTable(tableData)
        console.log('✅ Table loaded:', tableData.number)

        // Crear o recuperar sesión de mesa
        await createOrResumeTableSession(tenantData.id, tableData.id, tableCode)
      }
      
      // Aplicar branding dinámico
      document.title = `${tenantData.name} - Tappmesa`
      if (tenantData.primary_color) {
        document.documentElement.style.setProperty('--primary-color', tenantData.primary_color)
      }
      if (tenantData.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', tenantData.secondary_color)
      }
      
    } catch (error) {
      console.error('❌ Error loading tenant:', error)
      setError(error.message)
      setTenant(null)
      setTable(null)
      setTableSession(null)
    } finally {
      setLoading(false)
    }
  }

  const createOrResumeTableSession = async (tenantId, tableId, tableCode) => {
    try {
      // Buscar sesión activa existente
      const { data: existingSession } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('table_id', tableId)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingSession) {
        setTableSession(existingSession)
        console.log('✅ Resumed table session:', existingSession.session_code)
        return
      }

      // Crear nueva sesión
      const sessionCode = `${tableCode}-${Date.now().toString(36).toUpperCase()}`
      
      const { data: newSession, error } = await supabase
        .from('table_sessions')
        .insert({
          tenant_id: tenantId,
          table_id: tableId,
          session_code: sessionCode,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      setTableSession(newSession)
      console.log('✅ Created new table session:', sessionCode)

    } catch (error) {
      console.error('❌ Error managing table session:', error)
    }
  }

  useEffect(() => {
    loadTenant()
  }, [])

  const value = {
    tenant,
    table,
    tableSession,
    loading,
    error,
    appType,
    loadTenant,
    setTenant,
    subdomain: getSubdomain(),
    tableCode: getTableCode()
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

