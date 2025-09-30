import { createContext, useContext, useState, useEffect } from 'react'
import { useTenant } from '../hooks/useTenant'
import { supabase } from '../lib/supabase'

export const CartContext = createContext()

// Función para generar número de orden
const generateOrderNumber = async (tenantId) => {
  const today = new Date()
  const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD
  
  try {
    // Contar órdenes del día
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString().slice(0, 10) + 'T00:00:00.000Z')
      .lt('created_at', today.toISOString().slice(0, 10) + 'T23:59:59.999Z')

    if (error) throw error
    
    const orderCount = (count || 0) + 1
    return `${dateStr}-${orderCount.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Error generating order number:', error)
    return `${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  }
}

export const CartProvider = ({ children }) => {
  const { tenant, table, tableSession } = useTenant()
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    if (!tenant) return

    // Si hay sesión de mesa, usar el session_code para persistencia
    // Si no, usar tenant.id (para pedidos sin mesa específica)
    const storageKey = tableSession
      ? `cart_session_${tableSession.session_code}`
      : `cart_${tenant.id}`

    const savedCart = localStorage.getItem(storageKey)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Verificar que el carrito no sea muy antiguo (más de 4 horas)
        const oldestItem = parsedCart[0]?.addedAt
        if (oldestItem) {
          const hoursSince = (Date.now() - new Date(oldestItem).getTime()) / (1000 * 60 * 60)
          if (hoursSince > 4) {
            console.log('🧹 Carrito expirado, limpiando...')
            localStorage.removeItem(storageKey)
            setItems([])
            return
          }
        }
        setItems(parsedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [tenant, tableSession])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (!tenant) return

    const storageKey = tableSession
      ? `cart_session_${tableSession.session_code}`
      : `cart_${tenant.id}`

    if (items.length === 0) {
      // Si el carrito está vacío, remover del localStorage
      localStorage.removeItem(storageKey)
    } else {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, tenant, tableSession])

  // Agregar item al carrito
  const addItem = (product, quantity = 1, temperature = 'hot', notes = '') => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => 
        item.product.id === product.id && 
        item.temperature === temperature
      )

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si el item ya existe
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: quantity,
          notes: notes || updatedItems[existingItemIndex].notes
        }
        return updatedItems.filter(item => item.quantity > 0)
      } else if (quantity > 0) {
        // Agregar nuevo item
        return [...prevItems, {
          id: `${product.id}_${temperature}_${Date.now()}`,
          product,
          quantity,
          temperature,
          notes,
          addedAt: new Date().toISOString()
        }]
      }
      return prevItems
    })
  }

  // Remover item del carrito
  const removeItem = (itemId) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId))
  }

  // Actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  // Actualizar notas de un item
  const updateNotes = (itemId, notes) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId 
          ? { ...item, notes }
          : item
      )
    )
  }

  // Limpiar carrito
  const clearCart = () => {
    setItems([])
  }

  // Calcular totales
  const getItemTotal = (item) => {
    return item.product.price * item.quantity
  }

  const getSubtotal = () => {
    return items.reduce((total, item) => total + getItemTotal(item), 0)
  }

  const getTax = () => {
    // IVA en Chile es 19%
    return getSubtotal() * 0.19
  }

  const getTotal = () => {
    return getSubtotal() + getTax()
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  // Función para realizar el pedido
  const placeOrder = async (customerInfo) => {
    // if (isEmpty || !tenant) return { success: false, error: 'Carrito vacío o sin cafetería' }
    if (items.length === 0 || !tenant) return { success: false, error: 'Carrito vacío o sin cafetería' }

    try {
      setPlacingOrder(true)

      // Generar número de orden
      const orderNumber = await generateOrderNumber(tenant.id)

      // Calcular totales
      const subtotal = getSubtotal()
      const tax = getTax()
      const total = getTotal()

      // Calcular tiempo estimado (suma de tiempos de preparación)
      const estimatedTime = items.reduce((total, item) => {
        const prepTime = item.product.preparation_time || 5 // 5 min por defecto
        return total + (prepTime * item.quantity)
      }, 0)

      // Crear la orden en Supabase (dejar que genere el UUID automáticamente)
      const orderData = {
        tenant_id: tenant.id,
        table_session_id: tableSession?.id || null,
        table_number: table?.number || customerInfo.tableNumber || null,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        order_number: orderNumber,
        status: 'pending',
        subtotal: subtotal,
        tax: tax,
        total: total,
        estimated_time: Math.max(estimatedTime, 10), // Mínimo 10 minutos
        notes: customerInfo.notes || null
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Crear los items de la orden
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: getItemTotal(item),
        notes: `${item.temperature ? `Temperatura: ${item.temperature}` : ''}${item.notes ? ` | ${item.notes}` : ''}`
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Actualizar sesión de mesa si existe
      if (tableSession) {
        await supabase
          .from('table_sessions')
          .update({
            total_orders: (tableSession.total_orders || 0) + 1,
            total_amount: (tableSession.total_amount || 0) + total
          })
          .eq('id', tableSession.id)
      }

      // Limpiar carrito
      clearCart()
      closeCart()

      console.log('✅ Pedido creado:', order.order_number)
      console.log('✨ Fast Refresh test - useCart should be compatible now')
      
      return { 
        success: true, 
        order: order,
        message: `¡Pedido ${orderNumber} enviado! Tiempo estimado: ${Math.max(estimatedTime, 10)} minutos.`
      }

    } catch (error) {
      console.error('❌ Error creating order:', error)
      return { 
        success: false, 
        error: 'Error al procesar el pedido: ' + error.message 
      }
    } finally {
      setPlacingOrder(false)
    }
  }

  // Abrir/cerrar carrito
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen(!isOpen)

  const value = {
    // Estado
    items,
    isOpen,
    placingOrder,
    
    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    placeOrder,
    
    // Cálculos
    getItemTotal,
    getSubtotal,
    getTax,
    getTotal,
    getTotalItems,
    formatPrice,
    
    // Utilidades
    isEmpty: items.length === 0
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// useCart hook moved to src/hooks/useCart.js for Fast Refresh compatibility
