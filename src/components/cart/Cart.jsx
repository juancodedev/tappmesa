import { useState } from 'react'
import { useCart } from '../../hooks/useCart'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { useTenant } from '../../hooks/useTenant'
import { X, Plus, Minus, ShoppingCart, Trash2, MessageSquare, CheckCircle, Clock } from 'lucide-react'
import CartItem from '../../features/cart/components/CartItem'
const Cart = () => {
  const { table } = useTenant()
  const { 
    items, 
    isOpen, 
    closeCart, 
    clearCart, 
    getSubtotal, 
    getTax, 
    getTotal, 
    getTotalItems,
    formatPrice,
    isEmpty,
    placeOrder,
    placingOrder
  } = useCart()

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: table?.number || '',
    notes: ''
  })

  const [orderResult, setOrderResult] = useState(null)
  // Error inline en lugar de alert(): { field: 'name' | 'phone' | 'order', message }
  const [formError, setFormError] = useState(null)

  const handleClose = () => {
    setOrderResult(null)
    setFormError(null)
    closeCart()
  }

  useEscapeKey(handleClose, isOpen || !!orderResult?.success)

  const updateField = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
    if (formError?.field === field) setFormError(null)
  }

  // Auto-fill table number when table context changes (adjusted during
  // render instead of in an effect to avoid a cascading re-render)
  const [syncedTableNumber, setSyncedTableNumber] = useState(table?.number)
  if (table?.number !== syncedTableNumber) {
    setSyncedTableNumber(table?.number)
    if (table?.number) {
      setCustomerInfo(prev => ({ ...prev, tableNumber: table.number }))
    }
  }

  const handlePlaceOrder = async () => {
    if (isEmpty) return

    // Validaciones
    if (!customerInfo.name.trim()) {
      setFormError({ field: 'name', message: 'Por favor ingresa tu nombre' })
      return
    }

    if (!customerInfo.phone.trim()) {
      setFormError({ field: 'phone', message: 'Por favor ingresa tu teléfono' })
      return
    }

    // Validar formato de teléfono chileno (+56912345678 o 912345678)
    const chileanPhoneRegex = /^(\+56)?9\d{8}$/
    if (!chileanPhoneRegex.test(customerInfo.phone.trim())) {
      setFormError({ field: 'phone', message: 'Ingresa un teléfono chileno válido (ej: +56912345678 o 912345678)' })
      return
    }

    setFormError(null)

    // Realizar pedido
    const result = await placeOrder(customerInfo)
    
    if (result.success) {
      setOrderResult(result)
      // Limpiar formulario
      setCustomerInfo({
        name: '',
        phone: '',
        tableNumber: table?.number || '',
        notes: ''
      })
    } else {
      setFormError({ field: 'order', message: result.error || 'Error al procesar el pedido' })
    }
  }

  // Si hay un resultado exitoso, mostrar confirmación
  if (orderResult && orderResult.success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
          className="bg-white w-full h-auto sm:w-96 sm:rounded-lg overflow-hidden safe-area-bottom"
        >
          {/* Success Header */}
          <div className="bg-green-50 p-6 text-center border-b border-green-200">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 id="order-success-title" className="text-xl font-bold text-green-900 mb-2">
              ¡Pedido Enviado!
            </h2>
            <p className="text-green-700">
              Número de orden: <span className="font-mono font-bold">{orderResult.order.order_number}</span>
            </p>
          </div>

          {/* Order Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span>Tiempo estimado: <strong>{orderResult.order.estimated_time} minutos</strong></span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Información del pedido:</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Cliente:</strong> {orderResult.order.customer_name}</p>
                <p><strong>Teléfono:</strong> {orderResult.order.customer_phone}</p>
                {orderResult.order.table_number && (
                  <p><strong>Mesa:</strong> {orderResult.order.table_number}</p>
                )}
                <p><strong>Total:</strong> {formatPrice(orderResult.order.total)}</p>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Te notificaremos cuando tu pedido esté listo.</p>
              <p>¡Gracias por tu compra!</p>
            </div>
          </div>

          {/* Close Button */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="w-full bg-primary text-white py-3 border border-gray-500 rounded-lg font-semibold hover:text-white hover:bg-primary-700 transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        className="bg-white w-full h-[85dvh] sm:w-96 sm:h-auto sm:max-h-[90dvh] rounded-t-2xl sm:rounded-lg overflow-hidden flex flex-col safe-area-bottom"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 id="cart-title" className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            <span>Tu Pedido</span>
            {!isEmpty && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {getTotalItems()}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Cerrar carrito"
            className="touch-target justify-center hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tu carrito está vacío
              </h3>
              <p className="text-gray-600 text-sm">
                Agrega algunos productos de nuestro menú
              </p>
            </div>
          ) : (
            <>
              {/* Items del carrito */}
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>

              {/* Información del cliente */}
              <div className="px-4 pb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Información del pedido
                </h3>
                <div className="space-y-3">
                  {/* Teléfono - primero para detectar cliente */}
                  <div>
                    <label htmlFor="cart-phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Número de teléfono <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="cart-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      placeholder="Ej: +56912345678"
                      value={customerInfo.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      aria-invalid={formError?.field === 'phone'}
                      aria-describedby={formError?.field === 'phone' ? 'cart-phone-error' : undefined}
                      className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${formError?.field === 'phone' ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formError?.field === 'phone' && (
                      <p id="cart-phone-error" role="alert" className="text-sm text-red-700 mt-1">
                        {formError.message}
                      </p>
                    )}
                    {!customerInfo.phone && (
                      <div className="mt-2 bg-linear-to-r from-primary/10 to-red-50 border border-primary/30 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <span className="text-lg">🎁</span>
                          <div>
                            <p className="text-sm font-semibold text-primary mb-1">
                              ¡Únete a nuestro programa de fidelidad!
                            </p>
                            <p className="text-xs text-gray-700">
                              Regístrate y obtén <strong>descuentos exclusivos</strong>, promociones especiales y acumula puntos en cada compra. ¡Tu próximo café podría ser gratis! ☕
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nombre */}
                  <div>
                    <label htmlFor="cart-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre <span className="text-red-600" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="cart-name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="Tu nombre"
                      value={customerInfo.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      aria-invalid={formError?.field === 'name'}
                      aria-describedby={formError?.field === 'name' ? 'cart-name-error' : undefined}
                      className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${formError?.field === 'name' ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {formError?.field === 'name' && (
                      <p id="cart-name-error" role="alert" className="text-sm text-red-700 mt-1">
                        {formError.message}
                      </p>
                    )}
                  </div>

                  {/* Mesa */}
                  <div>
                    <label htmlFor="cart-table" className="block text-sm font-medium text-gray-700 mb-1">
                      Mesa
                    </label>
                    <input
                      id="cart-table"
                      type="text"
                      placeholder="Número de mesa"
                      value={customerInfo.tableNumber}
                      onChange={(e) => updateField('tableNumber', e.target.value)}
                      disabled={!!table}
                      className={`w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 ${
                        table ? 'bg-gray-50 cursor-not-allowed' : ''
                      }`}
                    />
                    {table && (
                      <p className="text-xs text-gray-600 mt-1">
                        Mesa detectada automáticamente
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con totales y botones */}
        {!isEmpty && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {formError?.field === 'order' && (
              <p role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {formError.message}
              </p>
            )}

            {/* Totales */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(getSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IVA (19%)</span>
                <span>{formatPrice(getTax())}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex space-x-3">
              <button
                onClick={clearCart}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={!customerInfo.name || !customerInfo.phone || placingOrder}
                className="flex-1 bg-primary text-white border border-gray-700 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {placingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar Pedido</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
