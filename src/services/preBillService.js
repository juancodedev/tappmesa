// src/services/preBillService.js - Servicio para gestión de pre-cuentas/pre-bills
import { supabase } from '../lib/supabase'

export const preBillService = {
  /**
   * Genera una pre-cuenta desde un pedido existente
   * @param {string} orderId - ID del pedido
   * @param {Object} options - Opciones adicionales { waiterName, guestCount }
   * @returns {Object} Pre-bill generada
   */
  async generatePreBill(orderId, options = {}) {
    try {
      // Obtener el pedido completo con sus items
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          table:tables (
            number,
            name
          ),
          table_session:table_sessions (
            id,
            waiter_name,
            guest_count
          ),
          order_items (
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            temperature,
            notes,
            product:products (
              name,
              category_id
            )
          ),
          tenant:tenants (
            id,
            name,
            tip_percentage,
            show_survey
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      if (!order) {
        throw new Error('Pedido no encontrado')
      }

      // Calcular subtotal desde los items
      const subtotal = order.order_items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal || (item.quantity * item.unit_price))
      }, 0)

      // Obtener porcentaje de propina configurado (por defecto 10%)
      const tipPercentage = parseFloat(order.tenant?.tip_percentage || 10.0)
      const tipAmount = (subtotal * tipPercentage) / 100

      // Calcular impuestos (IVA 19% ya está incluido en los precios)
      const tax = parseFloat(order.tax || 0)

      // Total = subtotal + propina (el IVA ya está incluido en subtotal)
      const total = subtotal + tipAmount

      // Crear el registro de pre-bill
      const preBillData = {
        tenant_id: order.tenant_id,
        order_id: orderId,
        table_session_id: order.table_session?.id || null,
        table_number: order.table?.number?.toString() || order.table_number || 'N/A',
        waiter_name: options.waiterName || order.table_session?.waiter_name || null,
        guest_count: options.guestCount || order.table_session?.guest_count || 1,
        subtotal: subtotal.toFixed(2),
        tip_percentage: tipPercentage.toFixed(2),
        tip_amount: tipAmount.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        generated_at: new Date().toISOString()
      }

      const { data: preBill, error: preBillError } = await supabase
        .from('pre_bills')
        .insert([preBillData])
        .select()
        .single()

      if (preBillError) throw preBillError

      // Retornar pre-bill con datos completos del pedido
      return {
        success: true,
        preBill: {
          ...preBill,
          order_number: order.order_number,
          tenant_name: order.tenant?.name,
          table_name: order.table?.name,
          items: order.order_items.map(item => ({
            name: item.product?.name || 'Producto',
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            subtotal: parseFloat(item.subtotal || (item.quantity * item.unit_price)),
            temperature: item.temperature,
            notes: item.notes
          })),
          show_survey: order.tenant?.show_survey || false
        }
      }
    } catch (error) {
      console.error('Error generating pre-bill:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Obtiene una pre-cuenta por su ID con todos los detalles
   * @param {string} preBillId - ID de la pre-cuenta
   * @returns {Object} Pre-bill con detalles completos
   */
  async getPreBill(preBillId) {
    try {
      const { data: preBill, error } = await supabase
        .from('pre_bills')
        .select(`
          *,
          order:orders (
            order_number,
            status,
            created_at,
            order_items (
              id,
              product_id,
              quantity,
              unit_price,
              subtotal,
              temperature,
              notes,
              product:products (
                name,
                category_id
              )
            )
          ),
          tenant:tenants (
            name,
            slug,
            show_survey
          ),
          table_session:table_sessions (
            session_code
          )
        `)
        .eq('id', preBillId)
        .single()

      if (error) throw error

      if (!preBill) {
        throw new Error('Pre-cuenta no encontrada')
      }

      return {
        success: true,
        data: {
          ...preBill,
          items: preBill.order?.order_items?.map(item => ({
            name: item.product?.name || 'Producto',
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            subtotal: parseFloat(item.subtotal || (item.quantity * item.unit_price)),
            temperature: item.temperature,
            notes: item.notes
          })) || []
        }
      }
    } catch (error) {
      console.error('Error fetching pre-bill:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Obtiene todas las pre-cuentas de un tenant
   * @param {string} tenantId - ID del tenant
   * @param {Object} filters - Filtros opcionales { startDate, endDate, tableNumber }
   * @returns {Array} Lista de pre-bills
   */
  async getTenantPreBills(tenantId, filters = {}) {
    try {
      let query = supabase
        .from('pre_bills')
        .select(`
          *,
          order:orders (
            order_number,
            status
          )
        `)
        .eq('tenant_id', tenantId)
        .order('generated_at', { ascending: false })

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('generated_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('generated_at', filters.endDate)
      }
      if (filters.tableNumber) {
        query = query.eq('table_number', filters.tableNumber)
      }

      const { data, error } = await query

      if (error) throw error

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error('Error fetching tenant pre-bills:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }
  },

  /**
   * Formatea una pre-cuenta para impresión o visualización
   * @param {Object} preBill - Datos de la pre-cuenta
   * @returns {Object} Pre-bill formateada para impresión
   */
  formatForPrint(preBill) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
      }).format(amount)
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(date)
    }

    return {
      header: {
        tenant_name: preBill.tenant?.name || preBill.tenant_name || 'Restaurant',
        order_number: preBill.order?.order_number || preBill.order_number || 'N/A',
        generated_at: formatDate(preBill.generated_at),
        table_number: preBill.table_number,
        waiter_name: preBill.waiter_name || 'N/A',
        guest_count: preBill.guest_count || 1
      },
      items: preBill.items?.map(item => ({
        quantity: item.quantity,
        name: item.name,
        unit_price: formatCurrency(item.unit_price),
        subtotal: formatCurrency(item.subtotal),
        temperature: item.temperature,
        notes: item.notes
      })) || [],
      totals: {
        subtotal: formatCurrency(parseFloat(preBill.subtotal)),
        tip_percentage: `${parseFloat(preBill.tip_percentage).toFixed(0)}%`,
        tip_amount: formatCurrency(parseFloat(preBill.tip_amount)),
        tax: formatCurrency(parseFloat(preBill.tax || 0)),
        total: formatCurrency(parseFloat(preBill.total))
      },
      footer: {
        disclaimer: 'COMPROBANTE NO VÁLIDO COMO BOLETA',
        show_survey: preBill.show_survey || preBill.tenant?.show_survey || false
      }
    }
  },

  /**
   * Actualiza el monto de propina de una pre-cuenta existente
   * @param {string} preBillId - ID de la pre-cuenta
   * @param {number} newTipPercentage - Nuevo porcentaje de propina
   * @returns {Object} Pre-bill actualizada
   */
  async updateTip(preBillId, newTipPercentage) {
    try {
      // Obtener la pre-cuenta actual
      const { data: preBill, error: fetchError } = await supabase
        .from('pre_bills')
        .select('subtotal, tax')
        .eq('id', preBillId)
        .single()

      if (fetchError) throw fetchError

      const subtotal = parseFloat(preBill.subtotal)
      const tipAmount = (subtotal * newTipPercentage) / 100
      const total = subtotal + tipAmount

      // Actualizar la pre-cuenta
      const { data, error } = await supabase
        .from('pre_bills')
        .update({
          tip_percentage: newTipPercentage.toFixed(2),
          tip_amount: tipAmount.toFixed(2),
          total: total.toFixed(2)
        })
        .eq('id', preBillId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('Error updating tip:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  /**
   * Obtiene estadísticas de pre-cuentas para un tenant
   * @param {string} tenantId - ID del tenant
   * @param {Object} dateRange - { startDate, endDate }
   * @returns {Object} Estadísticas
   */
  async getPreBillStats(tenantId, dateRange = {}) {
    try {
      let query = supabase
        .from('pre_bills')
        .select('total, tip_amount, generated_at')
        .eq('tenant_id', tenantId)

      if (dateRange.startDate) {
        query = query.gte('generated_at', dateRange.startDate)
      }
      if (dateRange.endDate) {
        query = query.lte('generated_at', dateRange.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      const stats = {
        total_prebills: data?.length || 0,
        total_revenue: data?.reduce((sum, pb) => sum + parseFloat(pb.total), 0) || 0,
        total_tips: data?.reduce((sum, pb) => sum + parseFloat(pb.tip_amount), 0) || 0,
        average_bill: 0,
        average_tip: 0
      }

      if (stats.total_prebills > 0) {
        stats.average_bill = stats.total_revenue / stats.total_prebills
        stats.average_tip = stats.total_tips / stats.total_prebills
      }

      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Error fetching pre-bill stats:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}
