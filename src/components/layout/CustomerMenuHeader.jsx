import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { supabase } from '../../lib/supabase'
import { Clock, ChefHat, CheckCircle, Package, ShoppingBag } from 'lucide-react'

const CustomerMenuHeader = ({ onOrdersClick }) => {
  const { tenant, tableSession, tableCode } = useTenant()
  const [currentOrder, setCurrentOrder] = useState(null)
  const [isDelayed, setIsDelayed] = useState(false)

  useEffect(() => {
    if (tableSession) {
      loadCurrentOrder()

      // Actualizar cada 15 segundos
      const interval = setInterval(() => {
        loadCurrentOrder()
      }, 15000)

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- polling cuando hay tableSession
  }, [tableSession])

  const loadCurrentOrder = async () => {
    if (!tableSession) return

    try {
      // Obtener el pedido más reciente que no esté cancelado o entregado
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('table_session_id', tableSession.id)
        .not('status', 'in', '(cancelled,delivered)')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const order = data[0]
        setCurrentOrder(order)

        // Verificar si está atrasado (más de 20 minutos)
        if (order.estimated_time) {
          const createdAt = new Date(order.created_at)
          const now = new Date()
          const minutesElapsed = (now - createdAt) / 1000 / 60
          setIsDelayed(minutesElapsed > order.estimated_time + 5)
        }
      } else {
        setCurrentOrder(null)
        setIsDelayed(false)
      }
    } catch (error) {
      console.error('Error loading current order:', error)
    }
  }

  const getOrderStatusInfo = () => {
    if (!currentOrder) {
      return {
        icon: ShoppingBag,
        color: 'bg-gray-100 text-gray-600',
        pulse: false
      }
    }

    // Si está atrasado, usar amarillo con pulse
    if (isDelayed) {
      return {
        icon: Clock,
        color: 'bg-yellow-400 text-yellow-900',
        pulse: true
      }
    }

    const statusMap = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        pulse: false
      },
      preparing: {
        icon: ChefHat,
        color: 'bg-blue-500 text-white',
        pulse: true
      },
      ready: {
        icon: CheckCircle,
        color: 'bg-green-500 text-white',
        pulse: true
      }
    }

    return statusMap[currentOrder.status] || statusMap.pending
  }

  const statusInfo = getOrderStatusInfo()
  const StatusIcon = statusInfo.icon

  // Extraer número de mesa del tableCode
  const getTableNumber = () => {
    if (!tableCode) return 'Mesa'

    // Si es formato nuevo (ABCD12345678), buscar en la DB
    // Si es formato viejo (coffee-co-mesa-1), extraer el número
    const oldFormatMatch = tableCode.match(/-mesa-(\d+)$/)
    if (oldFormatMatch) {
      return `Mesa ${oldFormatMatch[1]}`
    }

    // Para formato nuevo, mostrar el código
    return `Mesa ${tableCode.substring(0, 4)}`
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        {/* Botón de estado del pedido - Izquierda */}
        <button
          onClick={onOrdersClick}
          className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${statusInfo.color} ${
            statusInfo.pulse ? 'animate-pulse' : ''
          }`}
          aria-label="Ver estado del pedido"
        >
          <StatusIcon className="w-6 h-6" />

          {/* Badge con número de pedidos activos */}
          {currentOrder && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              1
            </span>
          )}
        </button>

        {/* Número de mesa - Centro */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">
            {getTableNumber()}
          </h1>
          {currentOrder && (
            <p className="text-xs text-gray-500">
              Pedido #{currentOrder.order_number}
            </p>
          )}
        </div>

        {/* Nombre del tenant - Derecha */}
        <div className="flex items-center">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
              {tenant?.name || 'Cafetería'}
            </p>
            <p className="text-xs text-gray-500">Menú digital</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default CustomerMenuHeader
