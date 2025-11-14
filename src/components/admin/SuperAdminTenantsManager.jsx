import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { planLimitsService } from '../../services/planLimitsService'
import {
  Building2,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Power,
  PowerOff,
  Package,
  Users,
  Calendar,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  DollarSign,
  BarChart3
} from 'lucide-react'

const SuperAdminTenantsManager = () => {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all tenants first (basic data)
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

      if (tenantsError) {
        console.error('Error loading tenants:', tenantsError)
        throw new Error(`Error al cargar tenants: ${tenantsError.message}`)
      }

      // Try to load subscriptions (may not exist yet)
      let subscriptionsMap = {}
      try {
        const { data: subscriptionsData } = await supabase
          .from('tenant_subscriptions')
          .select(`
            id,
            tenant_id,
            plan_id,
            subscription_status,
            custom_max_tables,
            custom_max_products,
            custom_max_people,
            created_at,
            updated_at
          `)

        if (subscriptionsData) {
          subscriptionsMap = subscriptionsData.reduce((acc, sub) => {
            acc[sub.tenant_id] = sub
            return acc
          }, {})
        }
      } catch (subError) {
        console.warn('Subscription tables not available yet:', subError)
      }

      // Try to load subscription plans (may not exist yet)
      let plansData = []
      try {
        const { data, error: plansError } = await supabase
          .from('subscription_plans')
          .select('*')

        if (!plansError && data) {
          plansData = data
        }
      } catch (planError) {
        console.warn('Subscription plans table not available yet:', planError)
      }

      // Get counts for each tenant
      const tenantsWithCounts = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          // Count tables
          const { count: tablesCount } = await supabase
            .from('tables')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Count products
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Count users
          const { count: usersCount } = await supabase
            .from('admin_users')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Count orders
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenant.id)

          // Attach subscription data if available
          const subscription = subscriptionsMap[tenant.id]

          return {
            ...tenant,
            tenant_subscriptions: subscription ? [subscription] : [],
            counts: {
              tables: tablesCount || 0,
              products: productsCount || 0,
              users: usersCount || 0,
              orders: ordersCount || 0
            }
          }
        })
      )

      setTenants(tenantsWithCounts)
      setPlans(plansData || [])
    } catch (error) {
      console.error('Error loading tenants:', error)
      const errorMessage = error.message || 'Error desconocido al cargar tenants'
      alert(`Error al cargar tenants: ${errorMessage}\n\nVerifica la consola para más detalles.`)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (tenant) => {
    if (!confirm(`¿Está seguro de ${tenant.is_active ? 'desactivar' : 'activar'} el tenant "${tenant.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          is_active: !tenant.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id)

      if (error) throw error

      alert(`Tenant ${tenant.is_active ? 'desactivado' : 'activado'} exitosamente`)
      loadData()
    } catch (error) {
      console.error('Error toggling tenant status:', error)
      alert('Error al cambiar el estado del tenant')
    }
  }

  const handleManageSubscription = (tenant) => {
    // Scroll to subscriptions section or open modal
    setSelectedTenant(tenant)
  }

  const handleViewTenant = (tenant) => {
    // Open tenant in new tab
    const subdomain = tenant.subdomain || tenant.slug
    const url = `http://${subdomain}.localhost:5173`
    window.open(url, '_blank')
  }

  const getPlanName = (subscription) => {
    if (!subscription?.[0]) return 'Sin plan'
    const plan = plans.find(p => p.id === subscription[0].plan_id)
    return plan?.name || 'Plan desconocido'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium'
    }).format(date)
  }

  const getDaysActive = (createdAt) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now - created)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredTenants = tenants.filter(tenant => {
    // Filter by search term
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.subdomain?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by status
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? tenant.is_active :
      statusFilter === 'inactive' ? !tenant.is_active :
      true

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando tenants...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Tenants</h1>
            <p className="text-gray-600 mt-1">
              {tenants.length} tenants totales • {tenants.filter(t => t.is_active).length} activos
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
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, slug o subdomain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {tenants.filter(t => t.is_active).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">
                {tenants.filter(t => !t.is_active).length}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Plan</p>
              <p className="text-2xl font-bold text-orange-600">
                {tenants.filter(t => t.tenant_subscriptions?.length > 0).length}
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tenants List */}
      {filteredTenants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron tenants
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay tenants registrados'}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recursos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  {/* Tenant Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {tenant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{tenant.slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {getPlanName(tenant.tenant_subscriptions)}
                      </div>
                      {tenant.tenant_subscriptions?.[0] && (
                        <div className="text-xs text-gray-500">
                          {tenant.tenant_subscriptions[0].subscription_status === 'active' ? (
                            <span className="text-green-600">● Activo</span>
                          ) : (
                            <span className="text-yellow-600">● Inactivo</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Resources */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center text-gray-600" title="Mesas">
                        <Building2 className="h-4 w-4 mr-1" />
                        {tenant.counts.tables}
                      </div>
                      <div className="flex items-center text-gray-600" title="Productos">
                        <Package className="h-4 w-4 mr-1" />
                        {tenant.counts.products}
                      </div>
                      <div className="flex items-center text-gray-600" title="Usuarios">
                        <Users className="h-4 w-4 mr-1" />
                        {tenant.counts.users}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tenant.is_active ? (
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

                  {/* Created At */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{formatDate(tenant.created_at)}</div>
                    <div className="text-xs text-gray-400">
                      Hace {getDaysActive(tenant.created_at)} días
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewTenant(tenant)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver sitio del tenant"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleManageSubscription(tenant)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Gestionar suscripción"
                      >
                        <Package className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(tenant)}
                        className={tenant.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={tenant.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {tenant.is_active ? <PowerOff className="h-5 w-5" /> : <Power className="h-5 w-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Tenant Details */}
      {selectedTenant && (
        <TenantDetailsModal
          tenant={selectedTenant}
          plans={plans}
          onClose={() => setSelectedTenant(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  )
}

// Modal de detalles y gestión de suscripción
const TenantDetailsModal = ({ tenant, plans, onClose, onUpdate }) => {
  const [selectedPlanId, setSelectedPlanId] = useState(
    tenant.tenant_subscriptions?.[0]?.plan_id || ''
  )
  const [customLimits, setCustomLimits] = useState({
    custom_max_tables: tenant.tenant_subscriptions?.[0]?.custom_max_tables || null,
    custom_max_products: tenant.tenant_subscriptions?.[0]?.custom_max_products || null,
    custom_max_people: tenant.tenant_subscriptions?.[0]?.custom_max_people || null
  })
  const [loading, setLoading] = useState(false)

  const handleAssignPlan = async () => {
    if (!selectedPlanId) {
      alert('Selecciona un plan')
      return
    }

    try {
      setLoading(true)
      const result = await planLimitsService.changeTenantPlan(tenant.id, selectedPlanId)

      if (result.success) {
        alert('Plan asignado exitosamente')
        onUpdate()
        onClose()
      } else {
        alert('Error al asignar plan: ' + result.error)
      }
    } catch (error) {
      console.error('Error assigning plan:', error)
      alert('Error al asignar plan')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateLimits = async () => {
    try {
      setLoading(true)
      const result = await planLimitsService.updateTenantLimits(tenant.id, customLimits)

      if (result.success) {
        alert('Límites actualizados exitosamente')
        onUpdate()
        onClose()
      } else {
        alert('Error al actualizar límites: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating limits:', error)
      alert('Error al actualizar límites')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{tenant.name}</h2>
              <p className="text-sm opacity-90">@{tenant.slug}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan de Suscripción
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Sin plan asignado</option>
              {plans.filter(p => p.is_active).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                    minimumFractionDigits: 0
                  }).format(plan.price)}/mes
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignPlan}
              disabled={loading || !selectedPlanId}
              className="mt-2 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Asignando...' : 'Asignar Plan'}
            </button>
          </div>

          {/* Custom Limits */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Límites Personalizados (opcional)
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Máximo de Mesas</label>
                <input
                  type="number"
                  min="1"
                  value={customLimits.custom_max_tables || ''}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    custom_max_tables: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Dejar vacío para usar límite del plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Máximo de Productos</label>
                <input
                  type="number"
                  min="1"
                  value={customLimits.custom_max_products || ''}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    custom_max_products: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Dejar vacío para usar límite del plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Máximo de Personas por Mesa</label>
                <input
                  type="number"
                  min="1"
                  value={customLimits.custom_max_people || ''}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    custom_max_people: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Dejar vacío para usar límite del plan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateLimits}
              disabled={loading}
              className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Actualizando...' : 'Actualizar Límites'}
            </button>
          </div>

          {/* Stats */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Estadísticas de Uso</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Mesas</div>
                <div className="text-2xl font-bold text-gray-900">{tenant.counts.tables}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Productos</div>
                <div className="text-2xl font-bold text-gray-900">{tenant.counts.products}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Usuarios</div>
                <div className="text-2xl font-bold text-gray-900">{tenant.counts.users}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600">Pedidos</div>
                <div className="text-2xl font-bold text-gray-900">{tenant.counts.orders}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminTenantsManager
