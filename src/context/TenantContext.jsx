/* eslint-disable react-refresh/only-export-components -- archivo de contexto que exporta Provider y utilidades */
import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import logger from '../utils/logger'

export const TenantContext = createContext()

// useTenant hook moved to src/hooks/useTenant.js for Fast Refresh compatibility

// Función mejorada para extraer subdominio y mesa
const getSubdomain = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')

  logger.dev('🌐 Hostname:', hostname, 'Parts:', parts)

  // Desarrollo local con .local o .localhost
  if (hostname.endsWith('.local') || hostname.endsWith('.localhost')) {
    // cafe-central.tappmesa.local → cafe-central
    // teteria-luna.localhost → teteria-luna
    if (parts.length >= 2) {
      const subdomain = parts[0]
      if (subdomain !== 'tappmesa' && subdomain !== 'www' && subdomain !== 'localhost') {
        logger.dev('🏠 Local subdomain detected:', subdomain)
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
      logger.dev('🔗 Query param detected:', cafeParam)
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
        logger.dev('🌍 Production subdomain detected:', subdomain)
        return subdomain
      }
    }
    return null
  }

  // Producción con Vercel: teteria-luna-tappmesa.vercel.app
  if (hostname.includes('tappmesa.vercel.app')) {
    // Nueva lógica para manejar formato: [nombre]-tappmesa.vercel.app
    if (parts.length >= 3) {
      const fullSubdomain = parts[0] // ej: "teteria-luna-tappmesa"

      // Verificar si termina con -tappmesa (nuevo formato)
      if (fullSubdomain.includes('-tappmesa')) {
        // Usar el nombre completo incluyendo -tappmesa para matching con DB
        if (!['www-tappmesa', 'admin-tappmesa', 'api-tappmesa', 'app-tappmesa'].includes(fullSubdomain)) {
          logger.dev('🚀 Vercel subdomain detected (new format):', fullSubdomain)
          return fullSubdomain
        }
      }
    }

    // Formato legacy: teteria-luna.tappmesa.vercel.app (por compatibilidad)
    if (parts.length >= 4) {
      const subdomain = parts[0]
      if (!['www', 'admin', 'api', 'app'].includes(subdomain)) {
        logger.dev('🚀 Vercel subdomain detected (legacy format):', subdomain)
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
      logger.dev('🏢 Custom subdomain detected:', subdomain)
      return subdomain
    }
  }

  return null
}

// Nueva función para extraer código de mesa
const getTableCode = () => {
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
      logger.dev('🪑 Table code detected (query param):', tableParam, isNewFormat ? '(new format)' : '(old format)')
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
      logger.dev('🪑 Table code detected (pathname):', potentialTableCode, isNewFormat ? '(new format)' : '(old format)')
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

  // Si hay código de mesa, es una sesión de mesa
  if (subdomain && tableCode) {
    return 'table'
  }

  // Admin: diferenciar entre super admin global y admin de tenant
  // Super Admin Global: tappmesa.vercel.app/admin, admin.tappmesa.com, localhost/admin SIN subdomain
  if (pathname.startsWith('/admin') || hostname.startsWith('admin.')) {
    // Si NO hay subdomain, es super admin global
    if (!subdomain) {
      return 'admin'
    }
    // Si HAY subdomain (ej: teteria-luna.tappmesa.vercel.app/admin)
    // es el admin específico de ese tenant
    return 'tenant'
  }

  // Si hay subdominio, es una cafetería
  if (subdomain) {
    return 'tenant'
  }

  // Landing page principal
  return 'landing'
}

export const TenantProvider = ({ children }) => {
  const authContext = useContext(AuthContext)
  const [tenant, setTenant] = useState(null)
  const [table, setTable] = useState(null)
  const [tableSession, setTableSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [appType, setAppType] = useState('landing')

  const loadTenant = async (tenantIdOverride = null) => {
    try {
      setLoading(true)
      setError(null)

      const subdomain = getSubdomain()
      const tableCode = getTableCode()
      const currentAppType = getAppType()
      setAppType(currentAppType)

      logger.dev('🔍 Loading tenant for:', {
        subdomain,
        tableCode,
        appType: currentAppType,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        tenantIdOverride
      })

      // Si es landing sin subdomain, no cargar tenant
      if (currentAppType === 'landing') {
        logger.dev('⚠️ AppType is landing - not loading tenant')
        setTenant(null)
        setTable(null)
        setTableSession(null)
        return
      }

      // Si es admin pero hay un tenantIdOverride (desde usuario autenticado), cargar ese tenant
      if (currentAppType === 'admin' && tenantIdOverride) {
        logger.dev('🔑 Loading tenant from authenticated user:', tenantIdOverride)

        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantIdOverride)
          .eq('is_active', true)
          .single()

        if (tenantError) {
          logger.error('❌ Tenant query error:', tenantError)
          throw new Error('No se pudo cargar la información del local')
        }

        setTenant(tenantData)
        logger.dev('✅ Tenant loaded from user:', tenantData.name)
        return
      }

      // Si es admin global (super admin sin tenant), no cargar tenant
      if (currentAppType === 'admin' && !tenantIdOverride) {
        logger.dev('⚠️ AppType is global admin - not loading tenant')
        setTenant(null)
        setTable(null)
        setTableSession(null)
        return
      }

      if (!subdomain) {
        logger.error('❌ No subdomain detected')
        throw new Error('No se pudo identificar el local')
      }

      logger.dev('🔎 Querying tenant with subdomain:', subdomain)

      // Buscar cafetería por subdomain
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single()

      if (tenantError) {
        logger.error('❌ Tenant query error:', tenantError)
        logger.error('❌ Subdomain searched:', subdomain)

        throw new Error(`Cafetería "${subdomain}" no encontrada`)
      }
      
      setTenant(tenantData)
      logger.dev('✅ Tenant loaded:', tenantData.name)
      
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
          logger.error('❌ Table not found:', tableError)
          throw new Error(`Mesa "${tableCode}" no encontrada`)
        }

        // Verificar si el código QR ha expirado
        if (tableData.qr_code_expires_at) {
          const expiresAt = new Date(tableData.qr_code_expires_at)
          const now = new Date()
          if (now > expiresAt) {
            logger.warn('❌ QR Code expired:', tableData.unique_code, 'expired at', expiresAt)
            throw new Error(`El código QR de esta mesa ha expirado. Por favor, solicita un código nuevo al personal.`)
          }
        }

        setTable(tableData)
        logger.dev('✅ Table loaded:', tableData.number)

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
      logger.error('❌ Error loading tenant:', error)
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
        logger.dev('✅ Resumed table session:', existingSession.session_code)
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
      logger.dev('✅ Created new table session:', sessionCode)

    } catch (error) {
      logger.error('❌ Error managing table session:', error)
    }
  }

  // Cargar tenant inicial
  useEffect(() => {
    loadTenant()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial al montar
  }, [])

  // Recargar tenant cuando cambie el usuario autenticado
  useEffect(() => {
    if (authContext?.user?.tenant_id) {
      logger.dev('👤 User authenticated with tenant_id:', authContext.user.tenant_id)
      loadTenant(authContext.user.tenant_id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar cuando cambie usuario
  }, [authContext?.user?.tenant_id])

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

