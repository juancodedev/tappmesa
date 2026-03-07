import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { preBillService } from '../../services/preBillService'
import { useTenant } from '../../hooks/useTenant'
import { Printer, Download, Edit2, QrCode, ArrowLeft, CheckCircle } from 'lucide-react'

const PreBillView = () => {
  const { preBillId } = useParams()
  const navigate = useNavigate()
  const { tenant: _tenant } = useTenant()
  const printRef = useRef()

  const [preBill, setPreBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditingTip, setIsEditingTip] = useState(false)
  const [newTipPercentage, setNewTipPercentage] = useState(10)

  useEffect(() => {
    if (preBillId) {
      loadPreBill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar cuando cambie preBillId
  }, [preBillId])

  const loadPreBill = async () => {
    try {
      setLoading(true)
      const result = await preBillService.getPreBill(preBillId)

      if (result.success) {
        setPreBill(result.data)
        setNewTipPercentage(parseFloat(result.data.tip_percentage))
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Error al cargar la pre-cuenta')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleUpdateTip = async () => {
    try {
      const result = await preBillService.updateTip(preBillId, newTipPercentage)

      if (result.success) {
        setPreBill(result.data)
        setIsEditingTip(false)
        loadPreBill() // Reload to get updated data
      } else {
        alert('Error al actualizar la propina')
      }
    } catch (err) {
      alert('Error al actualizar la propina')
      console.error(err)
    }
  }

  const _formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const _formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pre-cuenta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-orange-600 hover:text-orange-700 flex items-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        </div>
      </div>
    )
  }

  const formattedData = preBillService.formatForPrint(preBill)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - No se imprime */}
      <div className="print:hidden bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsEditingTip(!isEditingTip)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                <span>Editar Propina</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          {/* Editor de propina */}
          {isEditingTip && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porcentaje de Propina
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={newTipPercentage}
                  onChange={(e) => setNewTipPercentage(parseFloat(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="text-gray-600">%</span>
                <button
                  onClick={handleUpdateTip}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido imprimible */}
      <div ref={printRef} className="max-w-3xl mx-auto px-4 py-8 print:px-0 print:py-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
          {/* Encabezado */}
          <div className="bg-linear-to-r from-orange-500 to-red-500 text-white px-6 py-8 print:bg-white print:text-black print:border-b-2 print:border-black">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 print:text-black">
                {formattedData.header.tenant_name}
              </h1>
              <p className="text-lg print:text-gray-800">Pre-Cuenta</p>
              <p className="text-sm mt-2 print:text-gray-700">
                Pedido #{formattedData.header.order_number}
              </p>
            </div>
          </div>

          {/* Información de la mesa */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 print:bg-white">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Fecha y Hora:</span>
                <p className="font-medium">{formattedData.header.generated_at}</p>
              </div>
              <div>
                <span className="text-gray-600">Mesa:</span>
                <p className="font-medium">{formattedData.header.table_number}</p>
              </div>
              <div>
                <span className="text-gray-600">Mesero/a:</span>
                <p className="font-medium">{formattedData.header.waiter_name}</p>
              </div>
              <div>
                <span className="text-gray-600">Personas:</span>
                <p className="font-medium">{formattedData.header.guest_count}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Productos</h2>
            <div className="space-y-3">
              {formattedData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start pb-3 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{item.quantity}x</span>
                      <span className="text-gray-900">{item.name}</span>
                    </div>
                    {item.temperature && (
                      <p className="text-xs text-gray-500 ml-6">
                        {item.temperature === 'hot' ? '🔥 Caliente' :
                         item.temperature === 'cold' ? '🧊 Frío' :
                         item.temperature === 'iced' ? '❄️ Helado' : item.temperature}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-600 ml-6 italic">
                        Nota: {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium text-gray-900">{item.subtotal}</p>
                    <p className="text-xs text-gray-500">{item.unit_price} c/u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 print:bg-white">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-medium">{formattedData.totals.subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-700">
                <span>Propina ({formattedData.totals.tip_percentage})</span>
                <span className="font-medium">{formattedData.totals.tip_amount}</span>
              </div>

              {parseFloat(preBill.tax) > 0 && (
                <div className="flex justify-between text-gray-700 text-sm">
                  <span>IVA (incluido)</span>
                  <span>{formattedData.totals.tax}</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                <span>TOTAL</span>
                <span>{formattedData.totals.total}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-100 text-center print:bg-white print:border-t-2 print:border-gray-300">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
              {formattedData.footer.disclaimer}
            </p>

            {formattedData.footer.show_survey && (
              <div className="mt-4 print:mt-6">
                <div className="inline-block p-4 bg-white rounded-lg shadow-sm print:shadow-none">
                  <QrCode className="h-24 w-24 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-700 font-medium">
                    Escanea para responder nuestra encuesta
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ¡Y obtén un beneficio en tu próxima visita!
                  </p>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              ¡Gracias por su preferencia!
            </p>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style jsx="true">{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          @page {
            margin: 1cm;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  )
}

export default PreBillView
