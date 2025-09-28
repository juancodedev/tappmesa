// src/lib/supabase.js - Configuración de Supabase adaptada al esquema existente
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ⚠️ DEPRECATED: Autenticación insegura - usar secureAuthService en su lugar
// Importar el nuevo servicio seguro
import { secureAuthService } from './authService.js';

// Delegación al servicio seguro para compatibilidad hacia atrás
export const authService = {
  async signUp(userData) {
    console.warn('⚠️  authService.signUp is deprecated. Use secureAuthService instead.');
    return await secureAuthService.signUp(userData);
  },

  async signIn(email, password) {
    console.warn('⚠️  authService.signIn is deprecated. Use secureAuthService instead.');
    return await secureAuthService.signIn(email, password);
  },

  async signOut() {
    console.warn('⚠️  authService.signOut is deprecated. Use secureAuthService instead.');
    return await secureAuthService.signOut();
  },

  async getCurrentSession() {
    console.warn('⚠️  authService.getCurrentSession is deprecated. Use secureAuthService instead.');
    return await secureAuthService.getCurrentSession();
  },

  // Métodos legacy deprecados
  async hashPassword(password) {
    console.warn('⚠️  Client-side password hashing is deprecated and insecure. Server-side bcrypt is now used.');
    return password;
  },

  generateSessionToken() {
    console.warn('⚠️  Client-side session token generation is deprecated. Server-side generation is now used.');
    return null;
  },

  async getTrialStatus(tenantId) {
    try {
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('created_at, is_active')
        .eq('id', tenantId)
        .single()

      if (error) throw error

      const createdAt = new Date(tenant.created_at)
      const trialEndDate = new Date(createdAt)
      trialEndDate.setDate(trialEndDate.getDate() + 60)

      const now = new Date()
      const daysLeft = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24))

      return {
        endDate: trialEndDate.toISOString(),
        daysLeft: Math.max(0, daysLeft),
        isExpired: daysLeft <= 0,
        isExpiring: daysLeft <= 7 && daysLeft > 0
      }
    } catch (error) {
      console.error('Trial status error:', error)
      return null
    }
  }
}

// Funciones para el carrito y pedidos adaptadas al esquema existente
export const orderService = {
  // Crear pedido
  async createOrder(orderData) {
    try {
      // 1. Crear el pedido principal
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            tenant_id: orderData.tenantId,
            table_number: orderData.tableNumber.toString(),
            customer_name: orderData.customerInfo?.name || null,
            customer_phone: orderData.customerInfo?.phone || null,
            status: 'pending',
            subtotal: orderData.total,
            tax: orderData.total * 0.19, // 19% IVA por defecto
            total: orderData.total * 1.19,
            notes: orderData.customerInfo?.notes || null,
            order_number: orderNumber,
            estimated_time: 30 // tiempo estimado por defecto
          }
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Crear los items del pedido
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        notes: item.notes || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      return { success: true, order }
    } catch (error) {
      console.error('Create order error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener pedidos de un tenant
  async getOrders(tenantId, status = null) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(name, image_url)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, orders: data }
    } catch (error) {
      console.error('Get orders error:', error)
      return { success: false, error: error.message }
    }
  },

  // Actualizar estado del pedido
  async updateOrderStatus(orderId, status) {
    try {
      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Agregar timestamps específicos según el estado
      if (status === 'ready') {
        updateData.ready_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return { success: true, order: data }
    } catch (error) {
      console.error('Update order error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Funciones para el menú adaptadas al esquema existente
export const menuService = {
  // Obtener menú de un tenant por subdomain
  async getMenuBySubdomain(subdomain) {
    try {
      // 1. Obtener tenant por subdomain
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, business_type')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single()

      if (tenantError) throw tenantError

      // 2. Obtener productos disponibles
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('tenant_id', tenant.id)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (productsError) throw productsError

      // 3. Obtener categorías activas
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (categoriesError) throw categoriesError

      return {
        success: true,
        products,
        categories,
        restaurant: tenant
      }
    } catch (error) {
      console.error('Get menu error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener menú de un tenant por ID
  async getMenu(tenantId) {
    try {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('is_available', true)
        .order('display_order', { ascending: true })

      if (productsError) throw productsError

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (categoriesError) throw categoriesError

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('name, business_type')
        .eq('id', tenantId)
        .single()

      if (tenantError) throw tenantError

      return {
        success: true,
        products,
        categories,
        restaurant: tenant
      }
    } catch (error) {
      console.error('Get menu error:', error)
      return { success: false, error: error.message }
    }
  },

  // Crear/actualizar producto del menú
  async upsertProduct(tenantId, product) {
    try {
      const { data, error } = await supabase
        .from('products')
        .upsert([
          {
            ...product,
            tenant_id: tenantId,
            slug: product.name.toLowerCase().replace(/\s+/g, '-')
          }
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, product: data }
    } catch (error) {
      console.error('Upsert product error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Funciones de configuración y utilidades
export const configService = {
  // Obtener configuraciones del tenant
  async getTenantSettings(tenantId) {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single()

      if (error) throw error

      return { success: true, settings: data }
    } catch (error) {
      console.error('Get tenant settings error:', error)
      return { success: false, error: error.message }
    }
  },

  // Actualizar configuraciones del tenant
  async updateTenantSettings(tenantId, settings) {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error

      return { success: true, settings: data }
    } catch (error) {
      console.error('Update tenant settings error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener mesas de un tenant
  async getTables(tenantId) {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('number', { ascending: true })

      if (error) throw error

      return { success: true, tables: data }
    } catch (error) {
      console.error('Get tables error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Funciones para analytics y reportes
export const analyticsService = {
  // Obtener métricas de ventas
  async getSalesMetrics(tenantId, startDate, endDate) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          total,
          created_at,
          status,
          order_items(quantity, total_price)
        `)
        .eq('tenant_id', tenantId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('status', ['completed', 'delivered'])

      if (error) throw error

      // Calcular métricas
      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0)
      const totalOrders = orders.length
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0
      
      const dailySales = orders.reduce((acc, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + parseFloat(order.total)
        return acc
      }, {})

      return {
        success: true,
        metrics: {
          totalSales,
          totalOrders,
          averageOrderValue,
          dailySales
        }
      }
    } catch (error) {
      console.error('Get sales metrics error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener productos más vendidos
  async getTopProducts(tenantId, limit = 10) {
    try {
      const { data, error } = await supabase
        .rpc('get_top_products', {
          tenant_id_param: tenantId,
          limit_param: limit
        })

      if (error) throw error

      return { success: true, products: data }
    } catch (error) {
      console.error('Get top products error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Función RPC para productos más vendidos (agregar en Supabase)
/*
CREATE OR REPLACE FUNCTION get_top_products(tenant_id_param UUID, limit_param INT)
RETURNS TABLE (
  product_id UUID,
  product_name VARCHAR,
  total_quantity BIGINT,
  total_revenue NUMERIC
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
  FROM products p
  JOIN order_items oi ON p.id = oi.product_id
  JOIN orders o ON oi.order_id = o.id
  WHERE o.tenant_id = tenant_id_param
    AND o.status IN ('completed', 'delivered')
  GROUP BY p.id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_param;
END;
$ LANGUAGE plpgsql;
*/

// Funciones para gestión de clientes
export const customerService = {
  // Crear o actualizar cliente
  async upsertCustomer(tenantId, customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .upsert([
          {
            tenant_id: tenantId,
            phone: customerData.phone,
            name: customerData.name,
            email: customerData.email,
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, customer: data }
    } catch (error) {
      console.error('Upsert customer error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener historial de cliente
  async getCustomerHistory(customerId) {
    try {
      const { data, error } = await supabase
        .from('customer_order_history')
        .select(`
          *,
          order:orders(
            order_number,
            total,
            created_at,
            status
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, history: data }
    } catch (error) {
      console.error('Get customer history error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Funciones para notificaciones
export const notificationService = {
  // Enviar notificación (simular por ahora)
  async sendNotification(tenantId, type, message, data = {}) {
    try {
      // En producción, aquí integrarías con servicios como:
      // - Firebase Cloud Messaging
      // - SendGrid para emails
      // - Twilio para SMS
      
      console.log('Notification sent:', { tenantId, type, message, data })
      
      return { success: true }
    } catch (error) {
      console.error('Send notification error:', error)
      return { success: false, error: error.message }
    }
  }
}

// Funciones de utilidad
export const utils = {
  // Formatear precio en pesos chilenos
  formatPrice(amount) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  },

  // Formatear fecha
  formatDate(date) {
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  },

  // Formatear hora
  formatTime(time) {
    return new Intl.DateTimeFormat('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01T${time}`))
  },

  // Generar código QR para mesa
  generateTableQRCode(tenantSubdomain, tableNumber) {
    const baseUrl = process.env.REACT_APP_BASE_URL || 'https://tappmesa.com'
    return `${baseUrl}/${tenantSubdomain}/mesa/${tableNumber}`
  },

  // Validar horario de operación
  isOpenNow(businessHours) {
    const now = new Date()
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'lowercase' })
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
    
    const todayHours = businessHours[dayOfWeek]
    if (!todayHours || todayHours.closed) {
      return false
    }
    
    return currentTime >= todayHours.open && currentTime <= todayHours.close
  }
}
