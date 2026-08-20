/* eslint-disable react-refresh/only-export-components -- archivo de contexto que exporta Provider y utilidades */
import { createContext, useState, useEffect, useContext, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../services/api'
import { AuthContext } from './AuthContext'
import logger from '../utils/logger'
import { getSubdomain, getTableCode, getAppType } from '../utils/tenantUtils'

export const TenantContext = createContext()

// useTenant hook moved to src/hooks/useTenant.js for Fast Refresh compatibility

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
        await createOrResumeTableSession(tenantData.id, tableData.id)
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

  const createOrResumeTableSession = async (tenantId, tableId) => {
    try {
      // 2.5 flip: la sesión de mesa se crea/recupera SERVER-side vía la ruta
      // POST /api/table-sessions (task 1.8): verifica la mesa, resume la sesión
      // activa o INSERTa una nueva con capability_token HMAC (RTE-004). El
      // cliente deja de tocar `table_sessions` (anon pierde acceso post-lockdown).
      const data = await api.post('/api/table-sessions', {
        table_id: tableId,
        tenant_id: tenantId
      })

      if (!data?.session) throw new Error('No se pudo crear la sesión de mesa')

      setTableSession(data.session)
      logger.dev('✅ Table session ready:', data.session.session_code)
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

  const value = useMemo(() => ({
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadTenant es estable en la practica, agregarlo invalidaria el memo cada render
  }), [tenant, table, tableSession, loading, error, appType])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

