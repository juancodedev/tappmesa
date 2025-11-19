import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { planLimitsService } from '../../services/planLimitsService'
import {
  Building2,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Package,
  RefreshCw
} from 'lucide-react'

const TenantSubscriptionsManager = () => {
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTenant, setEditingTenant] = useState(null)
  const [customLimits, setCustomLimits] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load tenants with their subscriptions
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          is_active,
          created_at,
          tenant_subscriptions (
            id,
            plan_id,
            custom_max_tables,
            custom_max_products,
            custom_max_people,
            subscription_status,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (tenantsError) throw tenantsError

      // Load available plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (plansError) throw plansError

      setTenants(tenantsData || [])
      setPlans(plansData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignPlan = async (tenantId, planId) => {
    try {
      const result = await planLimitsService.changeTenantPlan(tenantId, planId)

      if (result.success) {
        alert('Plan asignado exitosamente')
        loadData()
      } else {
        alert('Error al asignar plan: ' + result.error)
      }
    } catch (error) {
      console.error('Error assigning plan:', error)
      alert('Error al asignar plan')
    }
  }

  const handleUpdateCustomLimits = async (tenantId) => {
    try {
      const limits = customLimits[tenantId] || {}

      const result = await planLimitsService.updateTenantLimits(tenantId, limits)

      if (result.success) {
        alert('Límites personalizados actualizados')
        setEditingTenant(null)
        setCustomLimits({})
        loadData()
      } else {
        alert('Error al actualizar límites: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating limits:', error)
      alert('Error al actualizar límites')
    }
  }

  const startEditingTenant = (tenant) => {
    const subscription = tenant.tenant_subscriptions?.[0]
    setEditingTenant(tenant.id)
    setCustomLimits({
      [tenant.id]: {
        custom_max_tables: subscription?.custom_max_tables || null,
        custom_max_products: subscription?.custom_max_products || null,
        custom_max_people: subscription?.custom_max_people || null
      }
    })
  }

  const updateCustomLimit = (tenantId, field, value) => {
    setCustomLimits({
      ...customLimits,
      [tenantId]: {
        ...(customLimits[tenantId] || {}),
        [field]: value === '' || value === null ? null : parseInt(value)
      }
    })
  }

  const getPlanName = (planId) => {
    const plan = plans.find(p => p.id === planId)
    return plan?.name || 'Sin plan'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando tenants...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Suscripciones de Tenants</h2>
          <p className="text-gray-600 mt-1">
            Gestiona los planes y límites personalizados de cada tenant
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tenants List */}
      {tenants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenants registrados
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {tenants.map((tenant) => {
            const subscription = tenant.tenant_subscriptions?.[0]
            const isEditing = editingTenant === tenant.id
            const limits = customLimits[tenant.id] || {}

            return (
              <div
                key={tenant.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6" />
                      <div>
                        <h3 className="text-lg font-bold">{tenant.name}</h3>
                        <p className="text-sm opacity-90">@{tenant.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {!tenant.is_active && (
                        <span className="text-xs bg-white/20 px-3 py-1 rounded">
                          Inactivo
                        </span>
                      )}
                      <span className="text-xs bg-white/20 px-3 py-1 rounded">
                        Desde {formatDate(tenant.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Plan actual */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan de Suscripción
                      </label>
                      <select
                        value={subscription?.plan_id || ''}
                        onChange={(e) => handleAssignPlan(tenant.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Sin plan asignado</option>
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: 'CLP',
                              minimumFractionDigits: 0
                            }).format(plan.price)}/mes
                          </option>
                        ))}
                      </select>

                      {subscription && (
                        <p className="mt-2 text-xs text-gray-600">
                          Estado:{' '}
                          <span className={`font-medium ${
                            subscription.subscription_status === 'active'
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}>
                            {subscription.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Límites personalizados */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Límites Personalizados
                        </label>
                        {!isEditing && subscription && (
                          <button
                            onClick={() => startEditingTenant(tenant)}
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600">
                            Mesas {isEditing ? '' : '(por defecto del plan)'}
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={limits.custom_max_tables || ''}
                              onChange={(e) => updateCustomLimit(tenant.id, 'custom_max_tables', e.target.value)}
                              placeholder="Dejar vacío para usar límite del plan"
                              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {subscription?.custom_max_tables || 'Límite del plan'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">
                            Productos {isEditing ? '' : '(por defecto del plan)'}
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={limits.custom_max_products || ''}
                              onChange={(e) => updateCustomLimit(tenant.id, 'custom_max_products', e.target.value)}
                              placeholder="Dejar vacío para usar límite del plan"
                              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {subscription?.custom_max_products || 'Límite del plan'}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-gray-600">
                            Personas por mesa {isEditing ? '' : '(por defecto del plan)'}
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              min="1"
                              value={limits.custom_max_people || ''}
                              onChange={(e) => updateCustomLimit(tenant.id, 'custom_max_people', e.target.value)}
                              placeholder="Dejar vacío para usar límite del plan"
                              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-900">
                              {subscription?.custom_max_people || 'Límite del plan'}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => {
                              setEditingTenant(null)
                              setCustomLimits({})
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm transition-colors"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancelar</span>
                          </button>
                          <button
                            onClick={() => handleUpdateCustomLimits(tenant.id)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            <span>Guardar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Usage Stats (if has subscription) */}
                  {subscription && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <BarChart3 className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Uso Actual</h4>
                      </div>

                      <TenantUsageStats tenantId={tenant.id} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Límites personalizados:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-blue-800">
            <li>Los límites personalizados sobrescriben los límites del plan base</li>
            <li>Dejar en blanco para usar el límite definido en el plan</li>
            <li>Los cambios se aplican inmediatamente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Subcomponente para mostrar estadísticas de uso
const TenantUsageStats = ({ tenantId }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [tenantId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const summary = await planLimitsService.getTenantUsageSummary(tenantId)
      setStats(summary)
    } catch (error) {
      console.error('Error loading usage stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <p className="text-sm text-gray-500">No se pudo cargar las estadísticas</p>
    )
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-3">
      {/* Tables */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-700">Mesas</span>
          <span className="font-medium">
            {stats.usage.tables.current} / {stats.usage.tables.limit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getProgressColor(stats.usage.tables.percentage)} transition-all`}
            style={{ width: `${Math.min(stats.usage.tables.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Products */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-700">Productos</span>
          <span className="font-medium">
            {stats.usage.products.current} / {stats.usage.products.limit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getProgressColor(stats.usage.products.percentage)} transition-all`}
            style={{ width: `${Math.min(stats.usage.products.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Features */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Funcionalidades activas:</p>
        <div className="flex flex-wrap gap-2">
          {stats.features.has_paper_prebill && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              <CheckCircle className="h-3 w-3" />
              <span>Pre-cuentas</span>
            </span>
          )}
          {stats.features.has_paper_command && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              <CheckCircle className="h-3 w-3" />
              <span>Comandas</span>
            </span>
          )}
          {stats.features.has_surveys && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              <CheckCircle className="h-3 w-3" />
              <span>Encuestas</span>
            </span>
          )}
          {stats.features.has_analytics && (
            <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              <CheckCircle className="h-3 w-3" />
              <span>Analíticas</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TenantSubscriptionsManager
