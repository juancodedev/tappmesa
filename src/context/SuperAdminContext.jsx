/* eslint-disable react-refresh/only-export-components -- archivo de contexto que exporta Provider */
import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logger from '../utils/logger'

export const SuperAdminContext = createContext()

/**
 * SuperAdminContext Provider
 * Manages the selected tenant for SuperAdmin views
 * Works in both local development and production (Vercel)
 */
export const SuperAdminProvider = ({ children }) => {
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all tenants on mount
  useEffect(() => {
    loadTenants()
  }, [])

  // Load selected tenant details when selectedTenantId changes
  useEffect(() => {
    if (selectedTenantId) {
      loadSelectedTenant()
    } else {
      setSelectedTenant(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar tenant seleccionado
  }, [selectedTenantId])

  const loadTenants = async () => {
    try {
      setLoading(true)
      logger.dev('🔍 [SuperAdmin] Loading all tenants...')

      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, subdomain, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      setTenants(data || [])
      logger.dev('✅ [SuperAdmin] Loaded tenants:', data?.length || 0)
    } catch (error) {
      logger.error('❌ [SuperAdmin] Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSelectedTenant = async () => {
    try {
      logger.dev('🔍 [SuperAdmin] Loading selected tenant:', selectedTenantId)

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', selectedTenantId)
        .eq('is_active', true)
        .single()

      if (error) throw error

      setSelectedTenant(data)
      logger.dev('✅ [SuperAdmin] Selected tenant loaded:', data?.name)
    } catch (error) {
      logger.error('❌ [SuperAdmin] Error loading selected tenant:', error)
      setSelectedTenant(null)
    }
  }

  const handleTenantChange = (tenantId) => {
    logger.dev('🔄 [SuperAdmin] Changing selected tenant:', tenantId)
    setSelectedTenantId(tenantId)

    // Store in localStorage for persistence across page reloads
    if (tenantId) {
      localStorage.setItem('superadmin-selected-tenant', tenantId)
    } else {
      localStorage.removeItem('superadmin-selected-tenant')
    }
  }

  // Restore selected tenant from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem('superadmin-selected-tenant')
    if (savedTenantId) {
      logger.dev('🔄 [SuperAdmin] Restoring selected tenant from localStorage:', savedTenantId)
      setSelectedTenantId(savedTenantId)
    }
  }, [])

  const value = {
    selectedTenantId,
    selectedTenant,
    tenants,
    loading,
    setSelectedTenantId: handleTenantChange,
    refreshTenants: loadTenants,
  }

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  )
}
