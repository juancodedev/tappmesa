import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    checkAuthStatus()
    
    // Limpiar sesiones expiradas cada 5 minutos
    const cleanupInterval = setInterval(cleanupExpiredSessions, 5 * 60 * 1000)
    return () => clearInterval(cleanupInterval)
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      
      if (!token) {
        setUser(null)
        setPermissions([])
        return
      }

      // Verificar sesión en base de datos
      const { data: sessionData, error: sessionError } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users (
            *,
            tenants (
              id,
              name,
              slug
            )
          )
        `)
        .eq('session_token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError || !sessionData) {
        console.log('Sesión inválida o expirada')
        await logout()
        return
      }

      const userData = sessionData.admin_users
      setUser({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        tenant_id: userData.tenant_id,
        tenant: userData.tenants,
        last_login: userData.last_login,
        session_id: sessionData.id
      })

      // Cargar permisos
      await loadPermissions(userData.role)

      // Actualizar último acceso
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id)

      console.log('✅ Usuario autenticado:', userData.full_name, '- Rol:', userData.role)

    } catch (error) {
      console.error('Error checking auth status:', error)
      await logout()
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async (role) => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('resource, action')
        .eq('role', role)

      if (error) throw error

      setPermissions(data || [])
    } catch (error) {
      console.error('Error loading permissions:', error)
      setPermissions([])
    }
  }

  const login = async (email, password) => {
    try {
      // En producción, esto debería ser una llamada a tu API de autenticación
      // Por ahora, simulamos la verificación directa en la base de datos
      
      const { data: userData, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

      if (error || !userData) {
        throw new Error('Credenciales inválidas')
      }

      // En producción, verificar password_hash con bcrypt
      // Por ahora, aceptamos cualquier password para demo
      // const isValidPassword = await bcrypt.compare(password, userData.password_hash)
      // if (!isValidPassword) {
      //   throw new Error('Credenciales inválidas')
      // }

      // Crear nueva sesión
      const sessionToken = generateSessionToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

      const { data: sessionData, error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          user_id: userData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Guardar token en localStorage
      localStorage.setItem('admin_token', sessionToken)

      // Establecer usuario
      setUser({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        tenant_id: userData.tenant_id,
        tenant: userData.tenants,
        session_id: sessionData.id
      })

      // Cargar permisos
      await loadPermissions(userData.role)

      // Log de auditoría
      await logAction('login', 'admin_session', sessionData.id)

      console.log('✅ Login exitoso:', userData.full_name)
      return { success: true }

    } catch (error) {
      console.error('Error en login:', error)
      return { 
        success: false, 
        error: error.message || 'Error de autenticación' 
      }
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      
      if (token && user) {
        // Eliminar sesión de base de datos
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', token)

        // Log de auditoría
        await logAction('logout', 'admin_session', user.session_id)
      }

      // Limpiar estado local
      localStorage.removeItem('admin_token')
      setUser(null)
      setPermissions([])

      console.log('✅ Logout exitoso')

    } catch (error) {
      console.error('Error en logout:', error)
      // Limpiar estado local aunque falle la base de datos
      localStorage.removeItem('admin_token')
      setUser(null)
      setPermissions([])
    }
  }

  const hasPermission = (resource, action) => {
    if (!user) return false
    
    // Super admin tiene todos los permisos
    if (user.role === 'super_admin') return true
    
    // Verificar permisos específicos
    return permissions.some(p => p.resource === resource && p.action === action)
  }

  const canAccessTenant = (tenantId) => {
    if (!user) return false
    
    // Super admin puede acceder a todos los tenants
    if (user.role === 'super_admin') return true
    
    // Otros roles solo pueden acceder a su tenant
    return user.tenant_id === tenantId
  }

  const logAction = async (action, resource, resourceId = null, oldValues = null, newValues = null) => {
    if (!user) return

    try {
      await supabase.rpc('log_admin_action', {
        p_user_id: user.id,
        p_action: action,
        p_resource: resource,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues
      })
    } catch (error) {
      console.error('Error logging action:', error)
    }
  }

  const cleanupExpiredSessions = async () => {
    try {
      await supabase.rpc('cleanup_expired_sessions')
    } catch (error) {
      console.error('Error cleaning up sessions:', error)
    }
  }

  const generateSessionToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const getClientIP = async () => {
    try {
      // En producción, esto debería venir del servidor
      return '127.0.0.1'
    } catch {
      return null
    }
  }

  const value = {
    user,
    loading,
    permissions,
    login,
    logout,
    hasPermission,
    canAccessTenant,
    logAction,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isTenantAdmin: user?.role === 'tenant_admin',
    isStaff: user?.role === 'staff'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider