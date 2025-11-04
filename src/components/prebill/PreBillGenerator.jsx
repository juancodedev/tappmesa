import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { preBillService } from '../../services/preBillService'
import { FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react'

const PreBillGenerator = ({ order, onSuccess }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [waiterName, setWaiterName] = useState(order?.table_session?.waiter_name || '')
  const [guestCount, setGuestCount] = useState(order?.table_session?.guest_count || 1)
  const [showForm, setShowForm] = useState(false)

  const handleGenerate = async (e) => {
    e?.preventDefault()

    try {
      setLoading(true)
      setError(null)

      const result = await preBillService.generatePreBill(order.id, {
        waiterName: waiterName || null,
        guestCount: parseInt(guestCount) || 1
      })

      if (result.success) {
        // Notificar éxito
        if (onSuccess) {
          onSuccess(result.preBill)
        }

        // Navegar a la vista de la pre-cuenta
        navigate(`/admin/prebills/${result.preBill.id}`)
      } else {
        setError(result.error || 'Error al generar la pre-cuenta')
      }
    } catch (err) {
      setError('Error al generar la pre-cuenta')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickGenerate = () => {
    // Generar sin mostrar el formulario, usando valores por defecto
    handleGenerate()
  }

  if (!order) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No hay pedido seleccionado</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botón rápido */}
      {!showForm && (
        <button
          onClick={handleQuickGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
        >
          {loading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <FileText className="h-5 w-5" />
              <span>Generar Pre-Cuenta</span>
            </>
          )}
        </button>
      )}

      {/* Botón para mostrar opciones */}
      {!showForm && !loading && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full text-sm text-gray-600 hover:text-gray-900"
        >
          ¿Agregar información adicional?
        </button>
      )}

      {/* Formulario extendido */}
      {showForm && (
        <form onSubmit={handleGenerate} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Mesero/a
            </label>
            <input
              type="text"
              value={waiterName}
              onChange={(e) => setWaiterName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Personas
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Generar</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info del pedido */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="text-blue-900">
          <span className="font-medium">Pedido:</span> #{order.order_number}
        </p>
        <p className="text-blue-800">
          <span className="font-medium">Mesa:</span> {order.table?.number || order.table_number}
        </p>
        <p className="text-blue-800">
          <span className="font-medium">Total:</span> {new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
          }).format(order.total)}
        </p>
      </div>
    </div>
  )
}

export default PreBillGenerator
