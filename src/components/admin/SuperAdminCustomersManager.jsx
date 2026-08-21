import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Users,
  Star,
  Phone,
  Mail,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Building2,
  Search,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminCustomersManager = () => {
  const [customers, setCustomers] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar tenant/filtro
  }, [selectedTenantId, customerFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (tenantsError) throw tenantsError
      setTenants(tenantsData || [])

      // Load customers
      let query = supabase
        .from('customers')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          )
        `)
        .order('total_spent', { ascending: false })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      // Filtrar por tipo de cliente
      if (customerFilter === 'vip') {
        query = query.eq('is_vip', true)
      } else if (customerFilter === 'frequent') {
        query = query.gte('total_orders', 5)
      } else if (customerFilter === 'new') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', thirtyDaysAgo)
      }

      const { data: customersData, error: customersError } = await query.limit(500)

      if (customersError) throw customersError

      setCustomers(customersData || [])
    } catch (error) {
      console.error('Error loading customers:', error)
      alert('Error al cargar clientes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.tenant?.name?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCustomerSegment = (customer) => {
    if (customer.is_vip) {
      return {
        text: 'VIP',
        color: 'bg-purple-100 text-purple-800',
        icon: Star
      }
    } else if (customer.total_orders >= 5) {
      return {
        text: 'Frecuente',
        color: 'bg-green-100 text-green-800',
        icon: TrendingUp
      }
    } else {
      return {
        text: 'Regular',
        color: 'bg-primary-50 text-gray-800',
        icon: Users
      }
    }
  }

  const getStats = () => {
    const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)

    return {
      total: filteredCustomers.length,
      vip: filteredCustomers.filter(c => c.is_vip).length,
      newThisMonth: filteredCustomers.filter(c => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        return new Date(c.created_at) >= thirtyDaysAgo
      }).length,
      totalRevenue: filteredCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      avgOrderValue: totalOrders > 0
        ? filteredCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / totalOrders
        : 0
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando clientes...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todos los clientes de todos los tenants
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-50 hover:bg-primary-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Tenant Selector */}
        <div className="mt-4">
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los clientes</option>
            <option value="vip">Solo VIP</option>
            <option value="frequent">Frecuentes (5+ pedidos)</option>
            <option value="new">Nuevos (últimos 30 días)</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Clientes VIP</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.vip}</p>
            </div>
            <Star className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Nuevos (30 días)</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.newThisMonth}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-primary-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
          <p className="text-gray-600">
            No se encontraron clientes con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const segment = getCustomerSegment(customer)
            const SegmentIcon = segment.icon

            return (
              <div
                key={customer.id}
                className="bg-white rounded-lg shadow-sm border border-primary-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header with segment */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${segment.color}`}>
                    <SegmentIcon className="h-3 w-3 mr-1" />
                    {segment.text}
                  </div>
                  {customer.loyalty_points > 0 && (
                    <div className="text-xs text-gray-500">
                      {customer.loyalty_points} pts
                    </div>
                  )}
                </div>

                {/* Customer info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {customer.name}
                  </h3>

                  <div className="space-y-1">
                    {customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`tel:${customer.phone}`} className="hover:text-orange-600">
                          {customer.phone}
                        </a>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <a href={`mailto:${customer.email}`} className="hover:text-orange-600 truncate">
                          {customer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenant */}
                <div className="mb-4 pb-4 border-b border-primary-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{customer.tenant?.name}</div>
                      <div className="text-xs text-gray-500">@{customer.tenant?.slug}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-cream-50 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">{customer.total_orders || 0}</div>
                    <div className="text-xs text-gray-500">Pedidos</div>
                  </div>

                  <div className="text-center p-2 bg-cream-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </div>
                    <div className="text-xs text-gray-500">Gastado</div>
                  </div>
                </div>

                {/* Last visit */}
                {customer.last_order_at && (
                  <div className="mt-3 pt-3 border-t border-primary-200">
                    <div className="flex items-center justify-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      Última visita: {formatDate(customer.last_order_at)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SuperAdminCustomersManager
