// src/services/planLimitsService.js - Servicio para gestión de límites de planes de suscripción
import { supabase } from '../lib/supabase'

export const planLimitsService = {
  /**
   * Obtiene el plan de suscripción activo de un tenant con límites personalizados si existen
   * @param {string} tenantId - ID del tenant
   * @returns {Object} Datos del plan con límites efectivos
   */
  async getTenantPlan(tenantId) {
    try {
      const { data: subscription, error: subError } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          plan:subscription_plans (*)
        `)
        .eq('tenant_id', tenantId)
        .eq('subscription_status', 'active')
        .single()

      if (subError) {
        // Si no tiene suscripción, devolver plan básico por defecto
        console.warn('No active subscription found, using default limits')
        return this.getDefaultPlan()
      }

      return {
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        plan_name: subscription.plan?.name || 'Unknown',
        status: subscription.subscription_status,
        limits: {
          max_tables: subscription.custom_max_tables ?? subscription.plan?.max_tables ?? 10,
          max_products: subscription.custom_max_products ?? subscription.plan?.max_products ?? 50,
          max_people_per_table: subscription.custom_max_people ?? subscription.plan?.max_people_per_table ?? 4
        },
        features: {
          has_paper_prebill: subscription.plan?.has_paper_prebill ?? true,
          has_paper_command: subscription.plan?.has_paper_command ?? true,
          has_surveys: subscription.plan?.has_surveys ?? false,
          has_analytics: subscription.plan?.has_analytics ?? false
        },
        price: subscription.plan?.price ?? 0
      }
    } catch (error) {
      console.error('Error fetching tenant plan:', error)
      return this.getDefaultPlan()
    }
  },

  /**
   * Obtiene el plan básico por defecto (sin suscripción)
   * @returns {Object} Plan básico
   */
  getDefaultPlan() {
    return {
      subscription_id: null,
      plan_id: null,
      plan_name: 'Básico',
      status: 'trial',
      limits: {
        max_tables: 5,
        max_products: 20,
        max_people_per_table: 4
      },
      features: {
        has_paper_prebill: false,
        has_paper_command: false,
        has_surveys: false,
        has_analytics: false
      },
      price: 0
    }
  },

  /**
   * Valida si el tenant puede agregar una nueva mesa
   * @param {string} tenantId - ID del tenant
   * @returns {Object} { allowed: boolean, current: number, limit: number, message: string }
   */
  async canAddTable(tenantId) {
    try {
      const plan = await this.getTenantPlan(tenantId)

      const { count, error } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (error) throw error

      const currentTables = count || 0
      const maxTables = plan.limits.max_tables

      return {
        allowed: currentTables < maxTables,
        current: currentTables,
        limit: maxTables,
        message: currentTables < maxTables
          ? 'Puede agregar más mesas'
          : `Ha alcanzado el límite de ${maxTables} mesas de su plan ${plan.plan_name}`
      }
    } catch (error) {
      console.error('Error validating table limit:', error)
      return {
        allowed: false,
        current: 0,
        limit: 0,
        message: 'Error al validar límite de mesas'
      }
    }
  },

  /**
   * Valida si el tenant puede agregar un nuevo producto
   * @param {string} tenantId - ID del tenant
   * @returns {Object} { allowed: boolean, current: number, limit: number, message: string }
   */
  async canAddProduct(tenantId) {
    try {
      const plan = await this.getTenantPlan(tenantId)

      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_available', true)

      if (error) throw error

      const currentProducts = count || 0
      const maxProducts = plan.limits.max_products

      return {
        allowed: currentProducts < maxProducts,
        current: currentProducts,
        limit: maxProducts,
        message: currentProducts < maxProducts
          ? 'Puede agregar más productos'
          : `Ha alcanzado el límite de ${maxProducts} productos de su plan ${plan.plan_name}`
      }
    } catch (error) {
      console.error('Error validating product limit:', error)
      return {
        allowed: false,
        current: 0,
        limit: 0,
        message: 'Error al validar límite de productos'
      }
    }
  },

  /**
   * Valida si el número de personas excede el límite por mesa
   * @param {string} tenantId - ID del tenant
   * @param {number} guestCount - Número de personas
   * @returns {Object} { allowed: boolean, count: number, limit: number, message: string }
   */
  async canAcceptGuests(tenantId, guestCount) {
    try {
      const plan = await this.getTenantPlan(tenantId)
      const maxPeople = plan.limits.max_people_per_table

      return {
        allowed: guestCount <= maxPeople,
        count: guestCount,
        limit: maxPeople,
        message: guestCount <= maxPeople
          ? 'Número de personas permitido'
          : `El límite por mesa es de ${maxPeople} personas según su plan ${plan.plan_name}`
      }
    } catch (error) {
      console.error('Error validating guest limit:', error)
      return {
        allowed: false,
        count: guestCount,
        limit: 0,
        message: 'Error al validar límite de personas'
      }
    }
  },

  /**
   * Verifica si el tenant tiene acceso a una funcionalidad específica
   * @param {string} tenantId - ID del tenant
   * @param {string} feature - Nombre de la funcionalidad ('paper_prebill', 'paper_command', 'surveys', 'analytics')
   * @returns {boolean} true si tiene acceso
   */
  async hasFeature(tenantId, feature) {
    try {
      const plan = await this.getTenantPlan(tenantId)

      const featureMap = {
        'paper_prebill': plan.features.has_paper_prebill,
        'paper_command': plan.features.has_paper_command,
        'surveys': plan.features.has_surveys,
        'analytics': plan.features.has_analytics
      }

      return featureMap[feature] ?? false
    } catch (error) {
      console.error('Error checking feature availability:', error)
      return false
    }
  },

  /**
   * Obtiene el resumen completo de uso vs límites para un tenant
   * @param {string} tenantId - ID del tenant
   * @returns {Object} Resumen completo de límites y uso actual
   */
  async getTenantUsageSummary(tenantId) {
    try {
      const plan = await this.getTenantPlan(tenantId)

      // Obtener conteo de mesas activas
      const { count: tableCount } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      // Obtener conteo de productos disponibles
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_available', true)

      return {
        plan_name: plan.plan_name,
        plan_status: plan.status,
        usage: {
          tables: {
            current: tableCount || 0,
            limit: plan.limits.max_tables,
            percentage: Math.round(((tableCount || 0) / plan.limits.max_tables) * 100)
          },
          products: {
            current: productCount || 0,
            limit: plan.limits.max_products,
            percentage: Math.round(((productCount || 0) / plan.limits.max_products) * 100)
          },
          max_people_per_table: plan.limits.max_people_per_table
        },
        features: plan.features,
        price: plan.price
      }
    } catch (error) {
      console.error('Error fetching usage summary:', error)
      return null
    }
  },

  /**
   * SuperAdmin: Actualiza los límites personalizados de un tenant
   * @param {string} tenantId - ID del tenant
   * @param {Object} customLimits - { custom_max_tables, custom_max_products, custom_max_people }
   * @returns {Object} Suscripción actualizada
   */
  async updateTenantLimits(tenantId, customLimits) {
    try {
      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .update({
          custom_max_tables: customLimits.custom_max_tables || null,
          custom_max_products: customLimits.custom_max_products || null,
          custom_max_people: customLimits.custom_max_people || null,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error updating tenant limits:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * SuperAdmin: Cambia el plan de suscripción de un tenant
   * @param {string} tenantId - ID del tenant
   * @param {string} planId - ID del nuevo plan
   * @returns {Object} Resultado de la operación
   */
  async changeTenantPlan(tenantId, planId) {
    try {
      // Verificar si ya existe una suscripción
      const { data: existing } = await supabase
        .from('tenant_subscriptions')
        .select('id')
        .eq('tenant_id', tenantId)
        .single()

      let result
      if (existing) {
        // Actualizar plan existente
        const { data, error } = await supabase
          .from('tenant_subscriptions')
          .update({
            plan_id: planId,
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('tenant_id', tenantId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Crear nueva suscripción
        const { data, error } = await supabase
          .from('tenant_subscriptions')
          .insert([{
            tenant_id: tenantId,
            plan_id: planId,
            subscription_status: 'active'
          }])
          .select()
          .single()

        if (error) throw error
        result = data
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('Error changing tenant plan:', error)
      return { success: false, error: error.message }
    }
  }
}
