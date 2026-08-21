import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { api } from '../../services/api'
import { Clock, ChefHat, CheckCircle, XCircle, Package, RefreshCw, Edit2 } from 'lucide-react'
import { useCart } from '../../hooks/useCart'

const TableOrdersHistory = () => {
  const { tableSession } = useTenant()
  const { addItem } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tableSession) {
      loadSessionOrders()

      // Actualizar cada 30 segundos
      const interval = setInterval(() => {
        loadSessionOrders()
      }, 30000)

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- polling cuando hay tableSession
  }, [tableSession])

  const loadSessionOrders = async () => {
    if (!tableSession) return

    try {
      // 2.6 flip: las órdenes de la sesión se leen vía la ruta server
      // GET /api/orders/my?capability= (RTE-002): misma forma embebida
      // order_items → products que la lectura directa anterior — drop-in.
      const data = await api.get(
        `/api/orders/my?capability=${encodeURIComponent(tableSession.capability_token)}`
      )

      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading session orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pendiente',
        description: 'Tu pedido está en cola'
      },
      preparing: {
        icon: ChefHat,
        color: 'bg-blue-100 text-blue-800',
        text: 'En Preparación',
        description: 'La cocina está preparando tu pedido'
      },
      ready: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: 'Listo',
        description: 'Tu pedido está listo'
      },
      delivered: {
        icon: Package,
        color: 'bg-purple-100 text-purple-800',
        text: 'Entregado',
        description: 'Pedido entregado a tu mesa'
      },
      cancelled: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        text: 'Cancelado',
        description: 'Este pedido fue cancelado'
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const canEditOrder = (order) => {
    // Solo se puede editar si está en estado pending
    return order.status === 'pending'
  }

  const handleEditOrder = async (order) => {
    if (!canEditOrder(order)) {
      alert('Este pedido ya no se puede modificar')
      return
    }

    // Agregar items del pedido al carrito
    if (confirm('¿Deseas agregar los items de este pedido al carrito para modificarlos?')) {
      order.order_items.forEach(item => {
        if (item.product) {
          // Extraer temperatura de las notas si existe
          const tempMatch = item.notes?.match(/Temperatura: (\w+)/)
          const temperature = tempMatch ? tempMatch[1] : 'hot'

          // Extraer notas personalizadas
          const customNotes = item.notes?.split('|')[1]?.trim() || ''

          addItem(item.product, item.quantity, temperature, customNotes)
        }
      })

      // Cancelar el pedido original vía ruta server (SEC-006: capability en
      // body, nunca headers)
      await api.post(`/api/orders/${order.id}/cancel`, {
        capability: tableSession.capability_token
      })

      loadSessionOrders()
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!tableSession) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay pedidos en esta sesión</p>
        <p className="text-sm text-gray-500 mt-1">
          Los pedidos que hagas aparecerán aquí
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Pedidos de esta sesión
          </h2>
          <p className="text-sm text-gray-600">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadSessionOrders}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status)
          const StatusIcon = statusInfo.icon

          return (
            <div key={order.id} className="p-4">
              {/* Header del pedido */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      #{order.order_number}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.text}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Ordenado a las {formatTime(order.created_at)}
                    {order.estimated_time && ` • ${order.estimated_time} min estimados`}
                  </p>
                </div>

                {canEditOrder(order) && (
                  <button
                    onClick={() => handleEditOrder(order)}
                    className="ml-2 p-2 text-primary hover:bg-red-50 rounded-lg transition-colors"
                    title="Editar pedido"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Items del pedido */}
              <div className="space-y-2 mb-3">
                {order.order_items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-3 flex-1">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.quantity}x {item.product?.name || 'Producto eliminado'}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-500">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total del pedido */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              {/* Notas del pedido */}
              {order.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Nota:</span> {order.notes}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total de la sesión */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Total de la sesión</p>
            <p className="text-xs text-gray-500">
              {tableSession.total_orders || orders.length} pedido{(tableSession.total_orders || orders.length) !== 1 ? 's' : ''}
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(tableSession.total_amount || orders.reduce((sum, o) => sum + parseFloat(o.total), 0))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TableOrdersHistory
