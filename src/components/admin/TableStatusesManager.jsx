import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage'
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Circle,
  CheckCircle,
  Users,
  Calendar,
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react'

const AVAILABLE_COLORS = [
  { value: '#22c55e', label: 'Verde', bg: 'bg-green-500' },
  { value: '#3b82f6', label: 'Azul', bg: 'bg-blue-500' },
  { value: '#eab308', label: 'Amarillo', bg: 'bg-yellow-500' },
  { value: '#f97316', label: 'Naranja', bg: 'bg-orange-500' },
  { value: '#ef4444', label: 'Rojo', bg: 'bg-red-500' },
  { value: '#8b5cf6', label: 'Púrpura', bg: 'bg-purple-500' },
  { value: '#64748b', label: 'Gris', bg: 'bg-gray-500' },
  { value: '#06b6d4', label: 'Cian', bg: 'bg-cyan-500' }
]

const AVAILABLE_ICONS = [
  { value: 'circle', label: 'Círculo', Icon: Circle },
  { value: 'check-circle', label: 'Check', Icon: CheckCircle },
  { value: 'users', label: 'Usuarios', Icon: Users },
  { value: 'calendar', label: 'Calendario', Icon: Calendar },
  { value: 'file-text', label: 'Documento', Icon: FileText },
  { value: 'sparkles', label: 'Brillo', Icon: Sparkles },
  { value: 'alert-circle', label: 'Alerta', Icon: AlertCircle }
]

const TableStatusesManager = () => {
  const { user, isSuperAdmin } = useAuth()
  const superAdminContext = useContext(SuperAdminContext)
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    color: '#22c55e',
    icon: 'circle'
  })

  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId
    }
    return user?.tenant_id || null
  }

  const tenantId = getTenantId()

  useEffect(() => {
    if (tenantId) {
      loadStatuses()
    }
  }, [tenantId, superAdminContext?.selectedTenantId])

  const loadStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('table_statuses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true })

      if (error) throw error

      setStatuses(data || [])
    } catch (error) {
      console.error('Error loading statuses:', error)
      alert('Error al cargar estados: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    try {
      const maxOrder = Math.max(...statuses.map(s => s.order_index), 0)

      const { error } = await supabase
        .from('table_statuses')
        .insert({
          tenant_id: tenantId,
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
          order_index: maxOrder + 1,
          is_system: false
        })

      if (error) throw error

      setFormData({ name: '', color: '#22c55e', icon: 'circle' })
      setCreating(false)
      loadStatuses()
    } catch (error) {
      console.error('Error creating status:', error)
      alert('Error al crear estado: ' + error.message)
    }
  }

  const handleUpdate = async (id) => {
    try {
      const { error } = await supabase
        .from('table_statuses')
        .update({
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setEditing(null)
      setFormData({ name: '', color: '#22c55e', icon: 'circle' })
      loadStatuses()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar estado: ' + error.message)
    }
  }

  const handleDelete = async (id, isSystem) => {
    if (isSystem) {
      alert('No se pueden eliminar estados del sistema')
      return
    }

    if (!confirm('¿Estás seguro de eliminar este estado?')) {
      return
    }

    try {
      // Verificar si hay mesas usando este estado
      const { data: tables, error: checkError } = await supabase
        .from('tables')
        .select('id')
        .eq('status_id', id)

      if (checkError) throw checkError

      if (tables && tables.length > 0) {
        alert(`No se puede eliminar: ${tables.length} mesa(s) están usando este estado`)
        return
      }

      const { error } = await supabase
        .from('table_statuses')
        .delete()
        .eq('id', id)

      if (error) throw error

      loadStatuses()
    } catch (error) {
      console.error('Error deleting status:', error)
      alert('Error al eliminar estado: ' + error.message)
    }
  }

  const handleMoveUp = async (status) => {
    const currentIndex = statuses.findIndex(s => s.id === status.id)
    if (currentIndex <= 0) return

    const aboveStatus = statuses[currentIndex - 1]

    try {
      // Intercambiar order_index
      await supabase
        .from('table_statuses')
        .update({ order_index: aboveStatus.order_index })
        .eq('id', status.id)

      await supabase
        .from('table_statuses')
        .update({ order_index: status.order_index })
        .eq('id', aboveStatus.id)

      loadStatuses()
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Error al reordenar: ' + error.message)
    }
  }

  const handleMoveDown = async (status) => {
    const currentIndex = statuses.findIndex(s => s.id === status.id)
    if (currentIndex >= statuses.length - 1) return

    const belowStatus = statuses[currentIndex + 1]

    try {
      // Intercambiar order_index
      await supabase
        .from('table_statuses')
        .update({ order_index: belowStatus.order_index })
        .eq('id', status.id)

      await supabase
        .from('table_statuses')
        .update({ order_index: status.order_index })
        .eq('id', belowStatus.id)

      loadStatuses()
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Error al reordenar: ' + error.message)
    }
  }

  const startEdit = (status) => {
    setEditing(status.id)
    setFormData({
      name: status.name,
      color: status.color,
      icon: status.icon
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setCreating(false)
    setFormData({ name: '', color: '#22c55e', icon: 'circle' })
  }

  const getIconComponent = (iconValue) => {
    const icon = AVAILABLE_ICONS.find(i => i.value === iconValue)
    return icon ? icon.Icon : Circle
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Show message if super admin hasn't selected a tenant
  if (isSuperAdmin && !tenantId) {
    return (
      <SuperAdminNoTenantMessage
        icon={Circle}
        message='Utiliza el selector en la barra superior para ver los estados de mesa de un tenant específico'
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Estados de Mesa
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona los estados disponibles para las mesas. El orden define el flujo de estados.
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Estado</span>
          </button>
        </div>
      </div>

      {/* Statuses List */}
      <div className="divide-y divide-gray-200">
        {statuses.map((status, index) => {
          const IconComponent = getIconComponent(status.icon)
          const isEditing = editing === status.id

          return (
            <div key={status.id} className="p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            formData.color === color.value
                              ? 'border-primary bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                          <span className="text-sm">{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icono
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_ICONS.map((icon) => (
                        <button
                          key={icon.value}
                          onClick={() => setFormData({ ...formData, icon: icon.value })}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            formData.icon === icon.value
                              ? 'border-primary bg-red-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <icon.Icon className="w-4 h-4" />
                          <span className="text-sm">{icon.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdate(status.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => handleMoveUp(status)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover arriba"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(status)}
                        disabled={index === statuses.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Mover abajo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: status.color + '20' }}
                    >
                      <IconComponent
                        className="w-6 h-6"
                        style={{ color: status.color }}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{status.name}</h3>
                        {status.is_system && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            Sistema
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Posición {index + 1} en el flujo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(status)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(status.id, status.is_system)}
                      disabled={status.is_system}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={status.is_system ? 'No se puede eliminar estado del sistema' : 'Eliminar'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Create New Status Form */}
        {creating && (
          <div className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Nuevo Estado</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Reservada, En espera..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-primary bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                      <span className="text-sm">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon.value}
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                        formData.icon === icon.value
                          ? 'border-primary bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <icon.Icon className="w-4 h-4" />
                      <span className="text-sm">{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCreate}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Estado</span>
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {statuses.length === 0 && !creating && (
        <div className="p-12 text-center">
          <Circle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No hay estados configurados</p>
          <p className="text-sm text-gray-500 mt-1">
            Crea tu primer estado para comenzar
          </p>
        </div>
      )}
    </div>
  )
}

export default TableStatusesManager
