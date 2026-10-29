import { useState, useMemo } from 'react'
import { Plus, Minus, Clock, Thermometer, Flame, Snowflake, Coffee, Leaf, CupSoda, Utensils } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import { useCart } from '../../hooks/useCart'
import { getOptimalTextClass } from '../../utils/helpers'
import { Button } from '../ui/Button'

const MenuCard = ({ product }) => {
  const { tenant } = useTenant()
  const { addItem, items } = useCart()
  const [selectedTemp, setSelectedTemp] = useState(product.temperature_options?.[0] || 'hot')

  // Calcular color de texto óptimo basado en el color principal del tenant
  const primaryColor = tenant?.primary_color || '#dc2626'
  const textClass = getOptimalTextClass(primaryColor)

  // Cantidad derivada del carrito (evita setState en effect)
  const quantity = useMemo(() => {
    const cartItem = items.find(item =>
      item.product.id === product.id &&
      item.temperature === selectedTemp
    )
    return cartItem ? cartItem.quantity : 0
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
      case 'hot': return <Flame className="w-3 h-3 text-orange-500" />
      case 'cold': return <Snowflake className="w-3 h-3 text-blue-400" />
      case 'iced': return <Snowflake className="w-3 h-3 text-blue-300" />
      default: return <Flame className="w-3 h-3 text-orange-500" />
    }
  }

  const getBeverageTypeIcon = (type) => {
    switch (type) {
      case 'coffee': return <Coffee className="w-4 h-4 text-amber-700" />
      case 'tea': return <Leaf className="w-4 h-4 text-green-600" />
      case 'cold': return <CupSoda className="w-4 h-4 text-blue-500" />
      case 'food': return <Utensils className="w-4 h-4 text-gray-500" />
      default: return <Coffee className="w-4 h-4 text-amber-700" />
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
            loading="lazy"
            decoding="async"
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-linear-to-br from-gray-100 to-gray-200 flex items-center justify-center">
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
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
            <p id={`temp-label-${product.id}`} className="text-xs font-medium text-gray-700 mb-2">Temperatura:</p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`temp-label-${product.id}`}>
              {product.temperature_options.map((temp) => (
                <button
                  key={temp}
                  onClick={() => setSelectedTemp(temp)}
                  aria-pressed={selectedTemp === temp}
                  className={`touch-target space-x-1 px-3 rounded-full text-sm font-medium transition-colors ${
                    selectedTemp === temp
                      ? textClass
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={selectedTemp === temp ? { backgroundColor: primaryColor } : {}}
                >
                  <span aria-hidden="true">{getTemperatureIcon(temp)}</span>
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
                  aria-label={`Quitar un ${product.name}`}
                  className="touch-target justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4 text-gray-600" aria-hidden="true" />
                </button>
              )}
              
              {quantity > 0 && (
                <span className="w-8 text-center font-semibold text-gray-900" aria-live="polite">
                  {quantity}
                </span>
              )}
              
              <Button
                variant="brand"
                onClick={handleAdd}
                aria-label={`Agregar un ${product.name}`}
                className="touch-target font-semibold"
              >
                {quantity === 0 ? (
                  <div className="flex items-center space-x-1">
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    <span>Agregar</span>
                  </div>
                ) : (
                  <Plus className="w-4 h-4" aria-hidden="true" />
                )}
              </Button>
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
