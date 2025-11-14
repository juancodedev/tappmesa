import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Users,
  Search,
  Filter,
  Shield,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Lock,
  Unlock
} from 'lucide-react'

const SystemUsersManager = () => {
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [tenantFilter, setTenantFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all admin users
      const { data: usersData, error: usersError } = await supabase
        .from('admin_users')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error loading users:', usersError)
        throw new Error(`Error al cargar usuarios: ${usersError.message}`)
      }

      // Load all tenants for filter
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name', { ascending: true })

      setUsers(usersData || [])
      setTenants(tenantsData || [])
    } catch (error) {
      console.error('Error loading system users:', error)
      alert(`Error al cargar usuarios del sistema: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    if (!confirm(`¿Está seguro de ${currentStatus ? 'desactivar' : 'activar'} este usuario?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      alert('Usuario actualizado exitosamente')
      loadData()
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Error al cambiar el estado del usuario')
    }
  }

  const getRoleName = (role) => {
    const roleNames = {
      'super_admin': 'Super Admin',
      'tenant_admin': 'Admin',
      'staff': 'Staff',
      'waiter': 'Mesero',
      'kitchen': 'Cocina'
    }
    return roleNames[role] || role
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      'super_admin': 'bg-purple-100 text-purple-800 border-purple-300',
      'tenant_admin': 'bg-blue-100 text-blue-800 border-blue-300',
      'staff': 'bg-green-100 text-green-800 border-green-300',
      'waiter': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'kitchen': 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    // Tenant filter
    const matchesTenant = tenantFilter === 'all' || user.tenant_id === tenantFilter

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? user.is_active :
      statusFilter === 'inactive' ? !user.is_active :
      true

    return matchesSearch && matchesRole && matchesTenant && matchesStatus
  })

  // Count statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    tenantAdmins: users.filter(u => u.role === 'tenant_admin').length
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando usuarios del sistema...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Gestiona todos los usuarios registrados en la plataforma
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todos los roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="tenant_admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="waiter">Mesero</option>
            <option value="kitchen">Cocina</option>
          </select>

          {/* Tenant Filter */}
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todos los tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-purple-600">{stats.superAdmins}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admins de Tenant</p>
              <p className="text-2xl font-bold text-blue-600">{stats.tenantAdmins}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron usuarios
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-linear-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Tenant */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.tenant ? (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.tenant.name}
                          </div>
                          <div className="text-xs text-gray-500">@{user.tenant.slug}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Sistema</span>
                    )}
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                      {user.role === 'super_admin' && <Shield className="h-3 w-3 mr-1" />}
                      {getRoleName(user.role)}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone && (
                      <div className="flex items-center mb-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {user.phone}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </td>

                  {/* Last Login */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(user.last_login || user.created_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                      className={`${
                        user.is_active
                          ? 'text-red-600 hover:text-red-900'
                          : 'text-green-600 hover:text-green-900'
                      } mr-3`}
                      title={user.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {user.is_active ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Panel de Usuarios del Sistema</p>
            <p className="mt-1">
              Aquí puedes ver todos los usuarios registrados en la plataforma, sin importar a qué tenant pertenezcan.
              Solo SuperAdmins tienen acceso a esta vista.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemUsersManager
