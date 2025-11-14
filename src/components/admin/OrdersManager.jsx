import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Eye,
  Phone,
  MapPin,
  DollarSign,
  Filter,
  Search
} from 'lucide-react'

const OrdersManager = () => {
  const { tenant: currentTenant } = useTenant()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (currentTenant) {
      loadOrders()
      // Configurar polling cada 30 segundos para órdenes en tiempo real
      const interval = setInterval(loadOrders, 30000)
      return () => clearInterval(interval)
    }
  }, [currentTenant, statusFilter])

  const loadOrders = async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              price
            )
          )
        `)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false })

      // Filtrar por estado si no es "all"
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando pedidos:', error)
        setOrders([])
        return
      }

      setOrders(data || [])
      console.log('✅ Pedidos cargados:', data?.length || 0)
      
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId || updating) return

    try {
      setUpdating(true)
      console.log(`Actualizando pedido ${orderId} a estado: ${newStatus}`)

      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('tenant_id', currentTenant.id) // Asegurar que pertenece al tenant actual
        .select()

      if (error) {
        console.error('Error de Supabase:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No se encontró el pedido o no tienes permisos para actualizarlo')
      }
      
      console.log('✅ Estado del pedido actualizado:', data[0])
      
      // Actualizar el estado local inmediatamente
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      )

      // Recargar después de un momento para sincronizar
      setTimeout(loadOrders, 1000)
      
    } catch (error) {
      console.error('Error updating order status:', error)
      alert(`Error al actualizar el pedido: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'preparing': return 'Preparando'
      case 'ready': return 'Listo'
      case 'delivered': return 'Entregado'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return Clock
      case 'preparing': return RefreshCw
      case 'ready': return CheckCircle
      case 'delivered': return CheckCircle
      case 'cancelled': return XCircle
      default: return Clock
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTimeElapsed = (createdAt) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMinutes = Math.floor((now - created) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Recién creado'
    if (diffMinutes === 1) return '1 minuto'
    if (diffMinutes < 60) return `${diffMinutes} minutos`
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  if (!currentTenant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenant disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del local. Verifica que estés en el dominio correcto.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h1>
          <p className="text-gray-600">
            Administra los pedidos de {currentTenant?.name || 'tu local'}
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="preparing">Preparando</option>
            <option value="ready">Listos</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'preparing').length}
            </p>
            <p className="text-sm text-gray-600">Preparando</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'ready').length}
            </p>
            <p className="text-sm text-gray-600">Listos</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
            <p className="text-sm text-gray-600">Entregados</p>
          </div>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status)
          
          return (
            <div key={order.id} className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden ${getStatusColor(order.status)}`}>
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">#{order.order_number}</h3>
                  <span className="text-sm text-gray-500">{formatTime(order.created_at)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{getStatusText(order.status)}</span>
                  </div>
                  <span className="text-sm text-gray-600">{getTimeElapsed(order.created_at)}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{order.customer_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{order.customer_phone}</span>
                  </div>
                  {order.table_number && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{order.table_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
                <div className="space-y-1">
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.products?.name}</span>
                      <span className="font-medium">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y tiempo */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(order.total)}</span>
                </div>
                {order.estimated_time && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Tiempo estimado: {order.estimated_time} min</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={updating}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Actualizando...' : 'Preparar'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={updating}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Actualizando...' : 'Cancelar'}
                      </button>
                    </>
                  )}
                  
                  {order.status === 'preparing' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={updating}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Actualizando...' : 'Marcar Listo'}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        disabled={updating}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {updating ? 'Actualizando...' : 'Cancelar'}
                      </button>
                    </>
                  )}
                  
                  {order.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      disabled={updating}
                      className="col-span-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Marcar Entregado'}
                    </button>
                  )}

                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="col-span-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver Detalles</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pedidos
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all' 
              ? 'Aún no se han realizado pedidos' 
              : `No hay pedidos con estado "${getStatusText(statusFilter).toLowerCase()}"`
            }
          </p>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Pedido #{selectedOrder.order_number}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cliente:</h4>
                <p className="text-gray-600">{selectedOrder.customer_name}</p>
                <p className="text-gray-600">{selectedOrder.customer_phone}</p>
                {selectedOrder.table_number && (
                  <p className="text-gray-600">{selectedOrder.table_number}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
                <div className="space-y-1">
                  {selectedOrder.order_items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.products?.name}</span>
                      <span>{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Estado:</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Fecha y hora:</h4>
                <p className="text-gray-600">
                  {new Date(selectedOrder.created_at).toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 bg-primary text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersManager
