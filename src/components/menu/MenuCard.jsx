import { useState, useEffect } from 'react'
import { Plus, Minus, Clock, Thermometer } from 'lucide-react'
import { useTenant } from '../../context/TenantContext'
import { useCart } from '../../context/CartContext'

const MenuCard = ({ product }) => {
  const { tenant } = useTenant()
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(0)
  const [selectedTemp, setSelectedTemp] = useState(product.temperature_options?.[0] || 'hot')

  // Sincronizar cantidad con el carrito
  useEffect(() => {
    const cartItem = items.find(item => 
      item.product.id === product.id && 
      item.temperature === selectedTemp
    )
    setQuantity(cartItem ? cartItem.quantity : 0)
  }, [items, product.id, selectedTemp])

  const handleAdd = () => {
    const newQuantity = quantity + 1
    addItem(product, newQuantity, selectedTemp)
  }

  const handleRemove = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1
      addItem(product, newQuantity, selectedTemp)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getTemperatureIcon = (temp) => {
    switch (temp) {
      case 'hot': return '🔥'
      case 'cold': return '🧊'
      case 'iced': return '❄️'
      default: return '🔥'
    }
  }

  const getBeverageTypeIcon = (type) => {
    switch (type) {
      case 'coffee': return '☕'
      case 'tea': return '🍃'
      case 'cold': return '🥤'
      case 'food': return '🍽️'
      default: return '☕'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Imagen del producto */}
      <div className="relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl">
              {getBeverageTypeIcon(product.beverage_type)}
            </span>
          </div>
        )}
        
        {/* Badge de destacado */}
        {product.is_featured && (
          <div className="absolute top-3 left-3">
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              ⭐ Destacado
            </span>
          </div>
        )}

        {/* Badge de no disponible */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
              No Disponible
            </span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4">
        {/* Header con nombre y tipo */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            {product.name}
          </h3>
          <span className="text-lg ml-2">
            {getBeverageTypeIcon(product.beverage_type)}
          </span>
        </div>

        {/* Descripción */}
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Info adicional */}
        <div className="flex items-center space-x-4 mb-3 text-xs text-gray-500">
          {product.preparation_time && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{product.preparation_time} min</span>
            </div>
          )}
          
          {product.temperature_options && product.temperature_options.length > 1 && (
            <div className="flex items-center space-x-1">
              <Thermometer className="w-3 h-3" />
              <span>Múltiples temperaturas</span>
            </div>
          )}
        </div>

        {/* Opciones de temperatura */}
        {product.temperature_options && product.temperature_options.length > 1 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Temperatura:</p>
            <div className="flex space-x-2">
              {product.temperature_options.map((temp) => (
                <button
                  key={temp}
                  onClick={() => setSelectedTemp(temp)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTemp === temp
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedTemp === temp ? { backgroundColor: tenant?.primary_color } : {}}
                >
                  <span>{getTemperatureIcon(temp)}</span>
                  <span className="capitalize">{temp === 'hot' ? 'Caliente' : temp === 'cold' ? 'Frío' : 'Helado'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Precio y botones */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          </div>

          {product.is_available ? (
            <div className="flex items-center space-x-2">
              {quantity > 0 && (
                <button
                  onClick={handleRemove}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors touch-target"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
              )}
              
              {quantity > 0 && (
                <span className="w-8 text-center font-semibold text-gray-900">
                  {quantity}
                </span>
              )}
              
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 touch-target hover:shadow-md"
                style={{ backgroundColor: tenant?.primary_color || '#dc2626' }}
              >
                {quantity === 0 ? (
                  <div className="flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-500 font-medium">
              No disponible
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuCard