import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import {
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  AlertCircle,
  Flame
} from 'lucide-react'

const KitchenDashboard = () => {
  const { tenant, loading: tenantLoading } = useTenant()
  const { user, logout } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // 'pending', 'preparing', 'ready', 'all'

  useEffect(() => {
    if (tenant) {
      loadOrders()

      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        loadOrders()
      }, 10000)

      return () => clearInterval(interval)
    } else if (!tenantLoading) {
      // Si no hay tenant y ya terminó de cargar, detener loading
      setLoading(false)
    }
  }, [tenant, tenantLoading, filter])

  const loadOrders = async () => {
    if (!tenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      let query = supabase
        .from('orders')
        .select(`
          *,
          table:tables (
            number
          ),
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            temperature,
            notes,
            product:products (
              name,
              category_id
            )
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true })

      // Filtrar por estado
      if (filter !== 'all') {
        query = query.eq('status', filter)
      } else {
        // Mostrar solo pendientes, en preparación y listos (no completed/cancelled)
        query = query.in('status', ['pending', 'preparing', 'ready'])
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading kitchen orders:', error)
      alert('Error al cargar pedidos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Reload orders
      loadOrders()
    } catch (error) {
      alert('Error al actualizar el pedido')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente'
      case 'preparing':
        return 'En Preparación'
      case 'ready':
        return 'Listo'
      case 'completed':
        return 'Completado'
      default:
        return status
    }
  }

  const getPriorityOrders = () => {
    // Priorizar por antigüedad (primero los más antiguos)
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateA - dateB
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString) => {
    const now = new Date()
    const created = new Date(dateString)
    const diffMs = now - created
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Recién creado'
    if (diffMins === 1) return 'Hace 1 minuto'
    if (diffMins < 60) return `Hace ${diffMins} minutos`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return 'Hace 1 hora'
    return `Hace ${diffHours} horas`
  }

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error: Cafetería no encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            No se pudo identificar la cafetería. Por favor, accede desde el subdominio correcto.
          </p>
          <p className="text-sm text-gray-500">
            Ejemplo: <code className="bg-gray-200 px-2 py-1 rounded">tu-cafeteria-tappmesa.localhost:5173/kitchen</code>
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Autenticación requerida
          </h1>
          <p className="text-gray-600 mb-4">
            Debes iniciar sesión para acceder al panel de cocina.
          </p>
          <a
            href="/admin/login"
            className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Ir a Login
          </a>
        </div>
      </div>
    )
  }

  const prioritizedOrders = getPriorityOrders()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Cocina - {tenant?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {user?.full_name || 'Cocinero'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadOrders}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualizar</span>
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mt-4 flex space-x-2 overflow-x-auto">
            {[
              { value: 'pending', label: 'Pendientes', icon: AlertCircle },
              { value: 'preparing', label: 'En Preparación', icon: Flame },
              { value: 'ready', label: 'Listos', icon: CheckCircle },
              { value: 'all', label: 'Todos', icon: null }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filter === filterOption.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filterOption.icon && <filterOption.icon className="h-4 w-4" />}
                <span>{filterOption.label}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {orders.filter(o => filterOption.value === 'all' ?
                    ['pending', 'preparing', 'ready'].includes(o.status) :
                    o.status === filterOption.value
                  ).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {prioritizedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay pedidos {filter !== 'all' ? getStatusText(filter).toLowerCase() : ''}
            </h3>
            <p className="text-gray-600">
              Los nuevos pedidos aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prioritizedOrders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-lg shadow-md border-2 ${
                  order.status === 'pending' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-gray-200'
                } overflow-hidden`}
              >
                {/* Order Header */}
                <div className={`px-4 py-3 ${getStatusColor(order.status)} border-b`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">
                        Pedido #{order.order_number}
                      </h3>
                      <p className="text-sm">
                        Mesa {order.table?.number || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(order.created_at)}</span>
                      </div>
                      <p className="text-xs mt-1">
                        {getTimeSince(order.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-4 py-3 max-h-64 overflow-y-auto">
                  <ul className="space-y-2">
                    {order.order_items?.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm border-b pb-2">
                        <div className="flex-1">
                          <span className="font-medium">{item.quantity}x</span>{' '}
                          <span>{item.product?.name}</span>
                          {item.temperature && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                              {item.temperature}
                            </span>
                          )}
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-1">
                              📝 {item.notes}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="px-4 py-3 bg-gray-50 border-t flex space-x-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Flame className="h-4 w-4" />
                      <span>Comenzar</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Marcar Listo</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Listo para servir</span>
                    </div>
                  )}

                  {(order.status === 'pending' || order.status === 'preparing') && (
                    <button
                      onClick={() => {
                        if (confirm('¿Cancelar este pedido?')) {
                          updateOrderStatus(order.id, 'cancelled')
                        }
                      }}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default KitchenDashboard
