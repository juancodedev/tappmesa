// src/lib/supabase.js - Configuración de Supabase adaptada al esquema existente
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones de autenticación adaptadas al esquema existente
export const authService = {
  // Registro de nuevo tenant/restaurante
  async signUp(userData) {
    try {
      // 1. Crear tenant (restaurante)
      const tenantSlug = userData.restaurantName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      const subdomain = tenantSlug + '-' + Math.random().toString(36).substr(2, 6);

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            name: userData.restaurantName,
            slug: tenantSlug,
            subdomain: subdomain,
            business_type: userData.restaurantType || 'cafe',
            phone: userData.phone,
            email: userData.email,
            address: userData.address,
            description: `Restaurante ${userData.restaurantName} ubicado en ${userData.city}`,
            is_active: true
          }
        ])
        .select()
        .single()

      if (tenantError) throw tenantError

      // 2. Crear usuario administrador del tenant
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 60) // 2 meses

      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .insert([
          {
            email: userData.email,
            password_hash: await this.hashPassword(userData.password),
            full_name: userData.ownerName,
            role: 'tenant_admin',
            tenant_id: tenantData.id,
            is_active: true
          }
        ])
        .select()
        .single()

      if (adminError) throw adminError

      // 3. Crear configuraciones del tenant
      await supabase
        .from('tenant_settings')
        .insert([
          {
            tenant_id: tenantData.id,
            table_service_enabled: true,
            takeaway_enabled: true,
            delivery_enabled: false
          }
        ])

      // 4. Crear mesas basadas en numberOfTables
      const tables = []
      for (let i = 1; i <= userData.numberOfTables; i++) {
        tables.push({
          tenant_id: tenantData.id,
          number: i.toString(),
          capacity: 4, // capacidad por defecto
          unique_code: `${tenantData.slug}-mesa-${i}`,
          status: 'available'
        })
      }

      await supabase
        .from('tables')
        .insert(tables)

      // 5. Crear categorías por defecto
      const defaultCategories = [
        { name: 'Bebidas Calientes', icon: '☕', display_order: 1 },
        { name: 'Bebidas Frías', icon: '🥤', display_order: 2 },
        { name: 'Comida', icon: '🍽️', display_order: 3 },
        { name: 'Postres', icon: '🍰', display_order: 4 }
      ]

      const categoriesWithTenant = defaultCategories.map(cat => ({
        ...cat,
        tenant_id: tenantData.id,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-')
      }))

      await supabase
        .from('categories')
        .insert(categoriesWithTenant)

      return {
        success: true,
        tenant: tenantData,
        admin: adminData,
        trialInfo: {
          endDate: trialEndDate,
          daysLeft: 60
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta'
      }
    }
  },

  // SECURITY WARNING: This is a demo implementation only!
  // In production, password hashing should be done server-side with bcrypt
  async hashPassword(password) {
    // TODO: Replace with proper server-side bcrypt hashing
    // This Base64 encoding is NOT secure and only for development
    console.warn('WARNING: Using insecure password hashing. Implement proper bcrypt on server-side.')
    return btoa(password) // Base64 temporal - NOT SECURE!
  },

  // Inicio de sesión
  async signIn(email, password) {
    try {
      const hashedPassword = await this.hashPassword(password)
      
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('email', email)
        .eq('password_hash', hashedPassword)
        .eq('is_active', true)
        .single()

      if (adminError) throw new Error('Email o contraseña incorrectos')

      // Actualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id)

      // Crear sesión
      const sessionToken = this.generateSessionToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 días

      await supabase
        .from('admin_sessions')
        .insert([
          {
            user_id: admin.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          }
        ])

      // Guardar token en localStorage
      localStorage.setItem('tappmesa-session', sessionToken)

      return {
        success: true,
        admin,
        tenant: admin.tenant,
        sessionToken
      }
    } catch (error) {
      console.error('Signin error:', error)
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      }
    }
  },

  // Generar token de sesión
  generateSessionToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  },

  // Cerrar sesión
  async signOut() {
    try {
      const sessionToken = localStorage.getItem('tappmesa-session')
      
      if (sessionToken) {
        // Invalidar sesión en la base de datos
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken)
      }

      localStorage.removeItem('tappmesa-session')
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener sesión actual
  async getCurrentSession() {
    try {
      const sessionToken = localStorage.getItem('tappmesa-session')
      if (!sessionToken) return null

      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_user:admin_users(
            *,
            tenant:tenants(*)
          )
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !session) {
        localStorage.removeItem('tappmesa-session')
        return null
      }

      return {
        admin: session.admin_user,
        tenant: session.admin_user.tenant,
        sessionToken
      }
    } catch (error) {
      console.error('Session error:', error)
      localStorage.removeItem('tappmesa-session')
      return null
    }
  },

  // Verificar estado del trial (para tenants en trial)
  async getTrialStatus(tenantId) {
    try {
      // En este esquema, el trial se maneja a nivel de tenant
      // Puedes agregar campos de trial a la tabla tenants si es necesario
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('created_at, is_active')
        .eq('id', tenantId)
        .single()

      if (error) throw error

      // Calcular trial basado en fecha de creación (2 meses)
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
