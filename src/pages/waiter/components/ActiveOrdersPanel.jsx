import { useState } from 'react'
import { Clock, ChefHat, CheckCircle, Package, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const ActiveOrdersPanel = ({ activeSessions, onRefresh }) => {
  const [updatingOrder, setUpdatingOrder] = useState(null)

  // Obtener todos los pedidos activos de todas las sesiones
  const activeOrders = activeSessions.flatMap(session =>
    (session.orders || []).map(order => ({
      ...order,
      table: session.table
    }))
  ).filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pendiente',
        nextStatus: 'preparing',
        nextLabel: 'Iniciar preparación'
      },
      preparing: {
        icon: ChefHat,
        color: 'bg-blue-100 text-blue-800',
        text: 'En Preparación',
        nextStatus: 'ready',
        nextLabel: 'Marcar como listo'
      },
      ready: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: 'Listo',
        nextStatus: 'delivered',
        nextLabel: 'Entregar'
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      onRefresh()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error al actualizar el pedido: ' + error.message)
    } finally {
      setUpdatingOrder(null)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getElapsedTime = (dateString) => {
    const created = new Date(dateString)
    const now = new Date()
    const minutes = Math.floor((now - created) / 1000 / 60)
    return minutes
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Pedidos Activos
        </h2>
        <p className="text-sm text-gray-600">
          {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} en proceso
        </p>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {activeOrders.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay pedidos activos</p>
            <p className="text-sm text-gray-500 mt-1">
              Los nuevos pedidos aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activeOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const StatusIcon = statusInfo.icon
              const elapsedMinutes = getElapsedTime(order.created_at)
              const isDelayed = elapsedMinutes > (order.estimated_time || 20)

              return (
                <div key={order.id} className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          Mesa {order.table.number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {statusInfo.text}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>#{order.order_number}</span>
                        <span>{formatTime(order.created_at)}</span>
                        <span className={`font-medium ${isDelayed ? 'text-red-600' : ''}`}>
                          {elapsedMinutes} min
                          {isDelayed && <AlertCircle className="w-3 h-3 inline ml-1" />}
                        </span>
                      </div>

                      <p className="text-sm font-medium text-gray-900 mt-2">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status !== 'delivered' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, statusInfo.nextStatus)}
                      disabled={updatingOrder === order.id}
                      className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      {updatingOrder === order.id ? 'Actualizando...' : statusInfo.nextLabel}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActiveOrdersPanel
