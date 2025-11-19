import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  Package,
  AlertCircle,
  DollarSign,
  Users,
  Table,
  ShoppingBag
} from 'lucide-react'

const SubscriptionPlansManager = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState(null)
  const [showNewPlanForm, setShowNewPlanForm] = useState(false)

  const emptyPlan = {
    name: '',
    description: '',
    price: 0,
    max_tables: 10,
    max_products: 50,
    max_people_per_table: 4,
    has_paper_prebill: true,
    has_paper_command: true,
    has_surveys: false,
    has_analytics: false,
    is_active: true
  }

  const [newPlan, setNewPlan] = useState(emptyPlan)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error loading plans:', error)
      alert('Error al cargar los planes')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([newPlan])
        .select()
        .single()

      if (error) throw error

      setPlans([...plans, data])
      setNewPlan(emptyPlan)
      setShowNewPlanForm(false)
      alert('Plan creado exitosamente')
    } catch (error) {
      console.error('Error creating plan:', error)
      alert('Error al crear el plan')
    }
  }

  const handleUpdatePlan = async (planId) => {
    try {
      const planToUpdate = plans.find(p => p.id === planId)

      const { error } = await supabase
        .from('subscription_plans')
        .update({
          ...planToUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error

      setEditingPlan(null)
      alert('Plan actualizado exitosamente')
      loadPlans()
    } catch (error) {
      console.error('Error updating plan:', error)
      alert('Error al actualizar el plan')
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!confirm('¿Está seguro de eliminar este plan? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error

      setPlans(plans.filter(p => p.id !== planId))
      alert('Plan eliminado exitosamente')
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Error al eliminar el plan. Puede que tenga tenants asociados.')
    }
  }

  const handleToggleActive = async (planId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) throw error

      loadPlans()
    } catch (error) {
      console.error('Error toggling plan status:', error)
      alert('Error al cambiar el estado del plan')
    }
  }

  const updatePlanField = (planId, field, value) => {
    setPlans(plans.map(p =>
      p.id === planId ? { ...p, [field]: value } : p
    ))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando planes...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planes de Suscripción</h2>
          <p className="text-gray-600 mt-1">Gestiona los planes disponibles para los tenants</p>
        </div>
        <button
          onClick={() => setShowNewPlanForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {/* Nuevo Plan Form */}
      {showNewPlanForm && (
        <div className="mb-6 bg-white border-2 border-orange-500 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Plan</h3>
            <button
              onClick={() => {
                setShowNewPlanForm(false)
                setNewPlan(emptyPlan)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Plan Básico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Mensual (CLP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Descripción del plan..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Mesas
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPlan.max_tables}
                  onChange={(e) => setNewPlan({ ...newPlan, max_tables: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Productos
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPlan.max_products}
                  onChange={(e) => setNewPlan({ ...newPlan, max_products: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Máx. Personas/Mesa
                </label>
                <input
                  type="number"
                  min="1"
                  value={newPlan.max_people_per_table}
                  onChange={(e) => setNewPlan({ ...newPlan, max_people_per_table: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlan.has_paper_prebill}
                  onChange={(e) => setNewPlan({ ...newPlan, has_paper_prebill: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Pre-cuentas en papel</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlan.has_paper_command}
                  onChange={(e) => setNewPlan({ ...newPlan, has_paper_command: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Comandas en papel</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlan.has_surveys}
                  onChange={(e) => setNewPlan({ ...newPlan, has_surveys: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Encuestas</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPlan.has_analytics}
                  onChange={(e) => setNewPlan({ ...newPlan, has_analytics: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Analíticas avanzadas</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowNewPlanForm(false)
                  setNewPlan(emptyPlan)
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Crear Plan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans List */}
      {plans.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay planes creados
          </h3>
          <p className="text-gray-600">
            Crea el primer plan de suscripción para tus tenants
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-md border-2 ${
                !plan.is_active ? 'border-gray-300 opacity-60' : 'border-gray-200'
              } overflow-hidden hover:shadow-lg transition-shadow`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
                {editingPlan === plan.id ? (
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => updatePlanField(plan.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-lg font-bold bg-white/20 border border-white/50 rounded text-white placeholder-white/70"
                  />
                ) : (
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                )}

                <div className="flex items-center justify-between mt-2">
                  {editingPlan === plan.id ? (
                    <input
                      type="number"
                      value={plan.price}
                      onChange={(e) => updatePlanField(plan.id, 'price', parseFloat(e.target.value))}
                      className="w-32 px-2 py-1 bg-white/20 border border-white/50 rounded text-white"
                    />
                  ) : (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-2xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-sm opacity-90">/mes</span>
                    </div>
                  )}

                  {!plan.is_active && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Inactivo</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {editingPlan === plan.id ? (
                  <textarea
                    value={plan.description || ''}
                    onChange={(e) => updatePlanField(plan.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="Descripción..."
                  />
                ) : (
                  <p className="text-sm text-gray-600">{plan.description || 'Sin descripción'}</p>
                )}

                {/* Límites */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Table className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Mesas</span>
                    </div>
                    {editingPlan === plan.id ? (
                      <input
                        type="number"
                        min="1"
                        value={plan.max_tables}
                        onChange={(e) => updatePlanField(plan.id, 'max_tables', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium">{plan.max_tables}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <ShoppingBag className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Productos</span>
                    </div>
                    {editingPlan === plan.id ? (
                      <input
                        type="number"
                        min="1"
                        value={plan.max_products}
                        onChange={(e) => updatePlanField(plan.id, 'max_products', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium">{plan.max_products}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">Personas/Mesa</span>
                    </div>
                    {editingPlan === plan.id ? (
                      <input
                        type="number"
                        min="1"
                        value={plan.max_people_per_table}
                        onChange={(e) => updatePlanField(plan.id, 'max_people_per_table', parseInt(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    ) : (
                      <span className="font-medium">{plan.max_people_per_table}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">Funcionalidades:</p>

                  {editingPlan === plan.id ? (
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.has_paper_prebill}
                          onChange={(e) => updatePlanField(plan.id, 'has_paper_prebill', e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-xs">Pre-cuentas en papel</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.has_paper_command}
                          onChange={(e) => updatePlanField(plan.id, 'has_paper_command', e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-xs">Comandas en papel</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.has_surveys}
                          onChange={(e) => updatePlanField(plan.id, 'has_surveys', e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-xs">Encuestas</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={plan.has_analytics}
                          onChange={(e) => updatePlanField(plan.id, 'has_analytics', e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <span className="text-xs">Analíticas avanzadas</span>
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1 text-xs">
                        {plan.has_paper_prebill ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={plan.has_paper_prebill ? 'text-gray-700' : 'text-gray-400'}>
                          Pre-cuentas en papel
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        {plan.has_paper_command ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={plan.has_paper_command ? 'text-gray-700' : 'text-gray-400'}>
                          Comandas en papel
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        {plan.has_surveys ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={plan.has_surveys ? 'text-gray-700' : 'text-gray-400'}>
                          Encuestas
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs">
                        {plan.has_analytics ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={plan.has_analytics ? 'text-gray-700' : 'text-gray-400'}>
                          Analíticas avanzadas
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                {editingPlan === plan.id ? (
                  <>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleUpdatePlan(plan.id)}
                      className="flex items-center space-x-1 text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Guardar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggleActive(plan.id, plan.is_active)}
                      className={`text-xs px-3 py-1 rounded transition-colors ${
                        plan.is_active
                          ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                          : 'bg-green-100 hover:bg-green-200 text-green-800'
                      }`}
                    >
                      {plan.is_active ? 'Desactivar' : 'Activar'}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingPlan(plan.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium">Información importante:</p>
          <ul className="list-disc list-inside mt-1 space-y-1 text-blue-800">
            <li>Los límites pueden ser personalizados por tenant desde el panel de gestión</li>
            <li>Los planes inactivos no están disponibles para nuevas suscripciones</li>
            <li>No se puede eliminar un plan que tenga tenants asociados</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlansManager
