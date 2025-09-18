import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useTenant } from '../../context/TenantContext'
import { X, Plus, Minus, ShoppingCart, Trash2, MessageSquare } from 'lucide-react'

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem, updateNotes, formatPrice, getItemTotal } = useCart()
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const handleNotesSubmit = () => {
    updateNotes(item.id, notes)
    setShowNotes(false)
  }

  const getTemperatureIcon = (temp) => {
    switch (temp) {
      case 'hot': return '🔥'
      case 'cold': return '🧊'
      case 'iced': return '❄️'
      default: return '🔥'
    }
  }

  const getTemperatureText = (temp) => {
    switch (temp) {
      case 'hot': return 'Caliente'
      case 'cold': return 'Frío'
      case 'iced': return 'Helado'
      default: return 'Caliente'
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start space-x-3">
        {/* Imagen del producto */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          {item.product.image_url ? (
            <img 
              src={item.product.image_url} 
              alt={item.product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {item.product.beverage_type === 'coffee' ? '☕' : 
               item.product.beverage_type === 'tea' ? '🍃' : '🥤'}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">
            {item.product.name}
          </h3>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {getTemperatureIcon(item.temperature)} {getTemperatureText(item.temperature)}
            </span>
            <span className="text-xs text-gray-500">
              {formatPrice(item.product.price)} c/u
            </span>
          </div>

          {item.notes && (
            <p className="text-xs text-gray-600 mt-1 italic">
              "{item.notes}"
            </p>
          )}

          {/* Controles de cantidad */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3 text-gray-600" />
              </button>
              
              <span className="w-8 text-center font-semibold text-sm">
                {item.quantity}
              </span>
              
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Agregar nota"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => removeItem(item.id)}
                className="p-1 text-red-400 hover:text-red-600 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <span className="font-semibold text-sm text-gray-900">
                {formatPrice(getItemTotal(item))}
              </span>
            </div>
          </div>

          {/* Campo de notas */}
          {showNotes && (
            <div className="mt-3 space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agregar instrucciones especiales..."
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleNotesSubmit}
                  className="text-xs bg-primary text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Cart = () => {
  const { tenant } = useTenant()
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
    isEmpty 
  } = useCart()

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    tableNumber: '',
    notes: ''
  })

  const handlePlaceOrder = () => {
    if (isEmpty) return

    // TODO: Enviar pedido a Supabase
    const orderData = {
      tenant_id: tenant.id,
      items: items,
      customer: customerInfo,
      totals: {
        subtotal: getSubtotal(),
        tax: getTax(),
        total: getTotal()
      }
    }

    console.log('Placing order:', orderData)
    alert('¡Pedido enviado! (En desarrollo)')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white w-full h-5/6 sm:w-96 sm:h-auto sm:max-h-5/6 sm:rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>Tu Pedido</span>
            {!isEmpty && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {getTotalItems()}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
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
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Número de teléfono"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Número de mesa (opcional)"
                    value={customerInfo.tableNumber}
                    onChange={(e) => setCustomerInfo({...customerInfo, tableNumber: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con totales y botones */}
        {!isEmpty && (
          <div className="border-t border-gray-200 p-4 space-y-4">
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
                disabled={!customerInfo.name || !customerInfo.phone}
                className="flex-2 bg-primary text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Enviar Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart