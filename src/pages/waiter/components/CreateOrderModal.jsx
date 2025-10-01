import { useState, useEffect } from 'react'
import { X, Plus, Minus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

const CreateOrderModal = ({ tenant, tables, selectedTable, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(selectedTable ? 'menu' : 'table')
  const [selectedTableId, setSelectedTableId] = useState(selectedTable?.id || '')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (tenant) {
      loadProducts()
      loadCategories()
    }
  }, [tenant])

  const loadProducts = async () => {
    setLoading(true)
    try {
      console.log('🍽️ Cargando productos para tenant:', tenant.id)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('❌ Error cargando productos:', error)
        throw error
      }

      console.log('✅ Productos cargados:', data?.length || 0)
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Error al cargar productos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category_id === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id)

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, notes: '' }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ))
    }
  }

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    const tax = subtotal * 0.19 // IVA 19%
    return subtotal + tax
  }

  const handleSubmit = async () => {
    if (!selectedTableId || cart.length === 0) {
      alert('Selecciona una mesa y agrega productos')
      return
    }

    setSubmitting(true)
    try {
      // 1. Buscar o crear sesión de mesa
      let { data: existingSession, error: sessionError } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('table_id', selectedTableId)
        .eq('status', 'active')
        .maybeSingle()

      if (sessionError && sessionError.code !== 'PGRST116') throw sessionError

      let sessionId
      if (existingSession) {
        sessionId = existingSession.id
      } else {
        // Crear nueva sesión
        const table = tables.find(t => t.id === selectedTableId)
        const { data: newSession, error: createSessionError } = await supabase
          .from('table_sessions')
          .insert({
            tenant_id: tenant.id,
            table_id: selectedTableId,
            session_code: `${table.unique_code}-${Date.now()}`,
            status: 'active',
            started_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createSessionError) throw createSessionError
        sessionId = newSession.id
      }

      // 2. Generar número de orden
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`

      // 3. Calcular totales
      const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      const tax = subtotal * 0.19
      const total = subtotal + tax

      // 4. Crear orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenant.id,
          table_session_id: sessionId,
          order_number: orderNumber,
          subtotal,
          tax,
          total,
          status: 'pending',
          order_type: 'dine-in'
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 5. Crear items de la orden
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 6. Actualizar totales de la sesión
      const newSessionTotal = (existingSession?.total_amount || 0) + total
      const newOrderCount = (existingSession?.total_orders || 0) + 1

      const { error: updateSessionError } = await supabase
        .from('table_sessions')
        .update({
          total_amount: newSessionTotal,
          total_orders: newOrderCount
        })
        .eq('id', sessionId)

      if (updateSessionError) throw updateSessionError

      // 7. Cambiar estado de la mesa a "ocupada" automáticamente
      const { error: updateTableError } = await supabase
        .from('tables')
        .update({
          status: 'occupied'
        })
        .eq('id', selectedTableId)

      if (updateTableError) {
        console.error('Error updating table status:', updateTableError)
        // No lanzamos error para no bloquear el flujo principal
      }

      onSuccess()
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al crear el pedido: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo Pedido</h2>
            {selectedTableId && (
              <p className="text-sm text-gray-600">
                Mesa {tables.find(t => t.id === selectedTableId)?.number}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Table Selection / Menu */}
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
            {currentStep === 'table' ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Selecciona una mesa</h3>
                <div className="grid grid-cols-3 gap-3">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setSelectedTableId(table.id)
                        setCurrentStep('menu')
                      }}
                      className={`p-4 border-2 rounded-lg hover:shadow-md transition-all ${
                        selectedTableId === table.id
                          ? 'border-primary bg-red-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-900">Mesa {table.number}</div>
                      <div className="text-sm text-gray-600">Cap: {table.capacity}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                      activeCategory === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                        activeCategory === category.id
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Products Grid */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando productos...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium mb-2">No se encontraron productos</p>
                    <p className="text-sm text-gray-600">
                      {searchTerm || activeCategory !== 'all'
                        ? 'Intenta con otro filtro o búsqueda'
                        : 'No hay productos disponibles para este local'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all text-left"
                      >
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                        )}
                        <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-primary font-bold">{formatPrice(product.price)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          {currentStep === 'menu' && (
            <div className="w-96 border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Carrito ({cart.length})</span>
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 max-h-[calc(90vh-300px)]">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Carrito vacío</p>
                    <p className="text-sm text-gray-500">Agrega productos al pedido</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm flex-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-bold text-gray-900">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    {formatPrice(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IVA (19%)</span>
                  <span className="font-semibold">
                    {formatPrice(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0) * 0.19)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-primary">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || submitting}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creando pedido...' : 'Crear Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateOrderModal
