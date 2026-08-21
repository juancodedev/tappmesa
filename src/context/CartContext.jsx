/* eslint-disable react-refresh/only-export-components -- archivo de contexto que exporta Provider y utilidades */
import { createContext, useState, useEffect, useMemo } from 'react'
import { useTenant } from '../hooks/useTenant'
import { api } from '../services/api'
import logger from '../utils/logger'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const { tenant, tableSession } = useTenant()
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
            logger.dev('🧹 Carrito expirado, limpiando...')
            localStorage.removeItem(storageKey)
            setItems([])
            return
          }
        }
        setItems(parsedCart)
      } catch (error) {
        logger.error('Error loading cart from localStorage:', error)
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

      // 2.4 flip: el pedido se crea SERVER-side vía POST /api/orders (task 1.7):
      // precios/IVA/order_number/session totals los calcula tappmesa_place_order
      // con service-role. El cliente deja de contar órdenes, calcular totales y
      // escribir en orders/order_items/table_sessions (anon pierde acceso
      // post-lockdown). Replay-safe: idempotency_key regenerada por pedido.
      const idempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`

      const body = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          temperature: item.temperature,
          notes: item.notes || null
        })),
        idempotency_key: idempotencyKey,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null
      }
      // Sesión de mesa (flujo QR): la capability viaja en body (SEC-006),
      // nunca en Authorization. Sin capability → takeout (tenant por Host).
      if (tableSession?.capability_token) {
        body.capability = tableSession.capability_token
      }

      const data = await api.post('/api/orders', body)

      if (!data?.order) throw new Error('Respuesta inválida del servidor')

      // total_orders/total_amount de la sesión los actualiza el server (RPC).

      // Limpiar carrito
      clearCart()
      closeCart()

      logger.dev('✅ Pedido creado:', data.order.order_number)
      
      return { 
        success: true, 
        order: data.order,
        duplicate: !!data.duplicate,
        message: `¡Pedido ${data.order.order_number} enviado! Tiempo estimado: ${data.order.estimated_time || 10} minutos.`
      }

    } catch (error) {
      logger.error('❌ Error creating order:', error)
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

  const value = useMemo(() => ({
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- funciones recreadas en cada render, useCallback agregaria complejidad innecesaria
  }), [items, isOpen, placingOrder])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// useCart hook moved to src/hooks/useCart.js for Fast Refresh compatibility
