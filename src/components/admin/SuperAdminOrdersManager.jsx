import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  ShoppingBag,
  Search,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Package
} from 'lucide-react'

const SuperAdminOrdersManager = () => {
  const [orders, setOrders] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tenantFilter, setTenantFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')

  useEffect(() => {
    loadData()
  }, [dateFilter, statusFilter, tenantFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Build date filter
      let dateQuery = null
      const now = new Date()

      switch (dateFilter) {
        case 'today':
          dateQuery = new Date(now.setHours(0, 0, 0, 0)).toISOString()
          break
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7))
          dateQuery = weekAgo.toISOString()
          break
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1))
          dateQuery = monthAgo.toISOString()
          break
      }

      // Load orders
      let query = supabase
        .from('orders')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          ),
          table:tables (
            number
          ),
          order_items (
            id,
            quantity,
            unit_price,
            subtotal
          )
        `)
        .order('created_at', { ascending: false })

      if (dateQuery) {
        query = query.gte('created_at', dateQuery)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (tenantFilter !== 'all') {
        query = query.eq('tenant_id', tenantFilter)
      }

      const { data: ordersData, error: ordersError } = await query.limit(200)

      if (ordersError) throw ordersError

      // Load tenants for filter
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name', { ascending: true })

      setOrders(ordersData || [])
      setTenants(tenantsData || [])
    } catch (error) {
      console.error('Error loading orders:', error)
      alert(`Error al cargar pedidos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'preparing': 'bg-blue-100 text-blue-800 border-blue-300',
      'ready': 'bg-green-100 text-green-800 border-green-300',
      'completed': 'bg-gray-100 text-gray-800 border-gray-300',
      'cancelled': 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Pendiente',
      'preparing': 'En Preparación',
      'ready': 'Listo',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    }
    return texts[status] || status
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Calculate stats
  const stats = {
    total: filteredOrders.length,
    revenue: filteredOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0),
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    completed: filteredOrders.filter(o => o.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando pedidos...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todos los pedidos de todos los tenants
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos los tenants</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="preparing">En Preparación</option>
            <option value="ready">Listos</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.revenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pedidos</h3>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  # Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mesa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.order_number}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.tenant?.name}
                        </div>
                        <div className="text-xs text-gray-500">@{order.tenant?.slug}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Mesa {order.table?.number || order.table_number || 'N/A'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customer_name || 'Sin nombre'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Package className="h-4 w-4 mr-1" />
                      {order.order_items?.length || 0} items
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SuperAdminOrdersManager
