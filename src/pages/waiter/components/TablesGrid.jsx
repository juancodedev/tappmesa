import { useState } from 'react'
import { Clock, Users, DollarSign, Edit, XCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const TablesGrid = ({ tables, activeSessions, view, onCreateOrder, onRefresh }) => {
  const [updatingTable, setUpdatingTable] = useState(null)

  const getTableSession = (tableId) => {
    return activeSessions.find(s => s.table_id === tableId)
  }

  const getTableStatus = (table) => {
    const session = getTableSession(table.id)

    if (!session) {
      return {
        label: 'Disponible',
        color: 'bg-green-100 text-green-800',
        bgColor: 'bg-green-50'
      }
    }

    const hasPendingOrders = session.orders?.some(o => ['pending', 'preparing'].includes(o.status))

    if (hasPendingOrders) {
      return {
        label: 'En servicio',
        color: 'bg-blue-100 text-blue-800',
        bgColor: 'bg-blue-50'
      }
    }

    return {
      label: 'Ocupada',
      color: 'bg-yellow-100 text-yellow-800',
      bgColor: 'bg-yellow-50'
    }
  }

  const handleCloseSession = async (session) => {
    if (!confirm(`¿Cerrar la sesión de la Mesa ${session.table.number}?`)) {
      return
    }

    setUpdatingTable(session.table_id)
    try {
      const { error } = await supabase
        .from('table_sessions')
        .update({ status: 'closed', ended_at: new Date().toISOString() })
        .eq('id', session.id)

      if (error) throw error

      onRefresh()
    } catch (error) {
      console.error('Error closing session:', error)
      alert('Error al cerrar la sesión: ' + error.message)
    } finally {
      setUpdatingTable(null)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0)
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (view === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mesas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {tables.map((table) => {
            const session = getTableSession(table.id)
            const status = getTableStatus(table)

            return (
              <div key={table.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-900">
                      {table.number}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">Mesa {table.number}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {session ? (
                        <div className="text-sm text-gray-600 flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(session.started_at)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatPrice(session.total_amount)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <span>{session.orders?.length || 0} pedidos</span>
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Capacidad: {table.capacity} personas
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {session ? (
                      <>
                        <button
                          onClick={() => onCreateOrder(table)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Agregar pedido"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCloseSession(session)}
                          disabled={updatingTable === table.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Cerrar sesión"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onCreateOrder(table)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Iniciar sesión"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Mesas</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const session = getTableSession(table.id)
          const status = getTableStatus(table)

          return (
            <button
              key={table.id}
              onClick={() => onCreateOrder(table)}
              className={`${status.bgColor} border-2 ${
                session ? 'border-blue-300' : 'border-gray-200'
              } rounded-lg p-4 hover:shadow-md transition-all text-left`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{table.number}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {session ? (
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(session.started_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-semibold">{formatPrice(session.total_amount)}</span>
                  </div>
                  <div className="text-gray-500">
                    {session.orders?.length || 0} pedido{(session.orders?.length || 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>Capacidad: {table.capacity}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TablesGrid
