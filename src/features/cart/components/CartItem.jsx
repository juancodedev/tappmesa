import { useState } from 'react'
import { useCart } from '../../../hooks/useCart'
import { X, Plus, Minus, Trash2, MessageSquare, Flame, Snowflake, Coffee, Utensils } from 'lucide-react'

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem, updateNotes, formatPrice, getItemTotal } = useCart()
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState(item.notes || '')

  const handleNotesSubmit = () => {
    updateNotes(item.id, notes)
    setShowNotes(false)
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start space-x-3">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
          {item.product.image_url ? (
            <img
              src={item.product.image_url}
              alt={item.product.name}
              loading="lazy"
              decoding="async"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {item.product.beverage_type === 'cold' ? <Snowflake className="w-6 h-6 text-blue-400" /> : item.product.beverage_type === 'hot' ? <Coffee className="w-6 h-6 text-amber-600" /> : <Utensils className="w-6 h-6 text-gray-400" />}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</h4>
              {item.product.description && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.product.description}</p>
              )}
            </div>
            <button
              onClick={() => removeItem(item.id)}
              className="touch-target justify-center shrink-0 -mt-2 -mr-2 hover:bg-red-50 rounded-lg transition-colors"
              aria-label={`Eliminar ${item.product.name}`}
            >
              <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" aria-hidden="true" />
            </button>
          </div>

          {/* Temperature Selector */}
          {item.product.has_temperature && (
            <div className="flex gap-1 mt-2">
              {['hot', 'cold', 'iced'].map((temp) => (
                <button
                  key={temp}
                  onClick={() => {/* handle temperature change */}}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    item.temperature === temp
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-primary'
                  }`}
                >
                  {temp === 'hot' ? <Flame className="w-3 h-3 inline" /> : temp === 'cold' ? <Snowflake className="w-3 h-3 inline" /> : <Snowflake className="w-3 h-3 inline opacity-60" />}
                </button>
              ))}
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="touch-target justify-center rounded-l-lg hover:bg-gray-100 transition-colors"
                aria-label={`Reducir cantidad de ${item.product.name}`}
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="touch-target justify-center rounded-r-lg hover:bg-gray-100 transition-colors"
                aria-label={`Aumentar cantidad de ${item.product.name}`}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <span className="text-sm font-semibold text-gray-900">{formatPrice(getItemTotal(item))}</span>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className={`touch-target justify-center ml-auto rounded-lg transition-colors ${
                item.notes ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label={item.notes ? `Editar notas de ${item.product.name}` : `Agregar notas a ${item.product.name}`}
              aria-expanded={showNotes}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Notes Input */}
          {showNotes && (
            <div className="mt-2">
              <label htmlFor={`notes-${item.id}`} className="sr-only">
                Notas para {item.product.name}
              </label>
              <textarea
                id={`notes-${item.id}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas para este producto..."
                className="w-full text-base border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={handleNotesSubmit}
                  className="text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Guardar
                </button>
                <button
                  onClick={() => { setShowNotes(false); setNotes(item.notes || '') }}
                  className="text-sm text-gray-600 px-4 py-2 hover:text-gray-800"
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

export default CartItem
