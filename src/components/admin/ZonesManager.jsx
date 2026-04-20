import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useTenant } from '../../hooks/useTenant'
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
  MapPin,
  Coffee,
  Layers
} from 'lucide-react'

const ZONE_COLORS = [
  { value: '#6366f1', label: 'Índigo',   bg: 'bg-indigo-500' },
  { value: '#3b82f6', label: 'Azul',     bg: 'bg-blue-500' },
  { value: '#06b6d4', label: 'Cian',     bg: 'bg-cyan-500' },
  { value: '#10b981', label: 'Verde',    bg: 'bg-emerald-500' },
  { value: '#f59e0b', label: 'Ámbar',   bg: 'bg-amber-500' },
  { value: '#f97316', label: 'Naranja',  bg: 'bg-orange-500' },
  { value: '#ef4444', label: 'Rojo',     bg: 'bg-red-500' },
  { value: '#ec4899', label: 'Rosa',     bg: 'bg-pink-500' },
  { value: '#8b5cf6', label: 'Púrpura', bg: 'bg-purple-500' },
  { value: '#64748b', label: 'Gris',     bg: 'bg-slate-500' }
]

const ZONE_ICONS = [
  { value: 'map-pin',    label: 'Pin',      Icon: MapPin },
  { value: 'coffee',     label: 'Café',     Icon: Coffee },
  { value: 'layers',     label: 'Capas',    Icon: Layers }
]

const DEFAULT_FORM = { name: '', description: '', color: '#6366f1', icon: 'map-pin' }

const ZonesManager = () => {
  const { user, isSuperAdmin } = useAuth()
  const { tenant: currentTenant } = useTenant()
  const superAdminContext = useContext(SuperAdminContext)

  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) return superAdminContext.selectedTenantId
    return user?.tenant_id || currentTenant?.id || null
  }

  const tenantId = getTenantId()

  const [zones, setZones]         = useState([])
  const [tableCounts, setTableCounts] = useState({})
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)   // zone id being edited
  const [creating, setCreating]   = useState(false)
  const [formData, setFormData]   = useState(DEFAULT_FORM)
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (tenantId) {
      loadZones()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, superAdminContext?.selectedTenantId])

  const loadZones = async () => {
    try {
      setLoading(true)

      const [{ data: zonesData, error: zonesErr }, { data: tablesData, error: tablesErr }] = await Promise.all([
        supabase
          .from('table_zones')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('order_index', { ascending: true }),
        supabase
          .from('tables')
          .select('zone_id')
          .eq('tenant_id', tenantId)
      ])

      if (zonesErr) throw zonesErr
      if (tablesErr) throw tablesErr

      setZones(zonesData || [])

      // Contar mesas por zona
      const counts = {}
      ;(tablesData || []).forEach(t => {
        if (t.zone_id) counts[t.zone_id] = (counts[t.zone_id] || 0) + 1
      })
      setTableCounts(counts)
    } catch (err) {
      console.error('Error loading zones:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return alert('El nombre es requerido')

    try {
      setSaving(true)
      const maxOrder = zones.length > 0 ? Math.max(...zones.map(z => z.order_index)) : -1

      const { error } = await supabase
        .from('table_zones')
        .insert({
          tenant_id: tenantId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          icon: formData.icon,
          order_index: maxOrder + 1
        })

      if (error) throw error

      setFormData(DEFAULT_FORM)
      setCreating(false)
      await loadZones()
    } catch (err) {
      console.error('Error creating zone:', err)
      alert('Error al crear zona: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id) => {
    if (!formData.name.trim()) return alert('El nombre es requerido')

    try {
      setSaving(true)
      const { error } = await supabase
        .from('table_zones')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          icon: formData.icon,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) throw error

      setEditing(null)
      setFormData(DEFAULT_FORM)
      await loadZones()
    } catch (err) {
      console.error('Error updating zone:', err)
      alert('Error al actualizar zona: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (zone) => {
    const count = tableCounts[zone.id] || 0
    if (count > 0) {
      return alert(`No se puede eliminar: ${count} mesa(s) están asignadas a esta zona. Muévelas primero.`)
    }
    if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) return

    try {
      const { error } = await supabase.from('table_zones').delete().eq('id', zone.id).eq('tenant_id', tenantId)
      if (error) throw error
      await loadZones()
    } catch (err) {
      console.error('Error deleting zone:', err)
      alert('Error al eliminar zona: ' + err.message)
    }
  }

  const handleMoveUp = async (zone) => {
    const idx = zones.findIndex(z => z.id === zone.id)
    if (idx <= 0) return
    const above = zones[idx - 1]
    try {
      await Promise.all([
        supabase.from('table_zones').update({ order_index: above.order_index }).eq('id', zone.id).eq('tenant_id', tenantId),
        supabase.from('table_zones').update({ order_index: zone.order_index }).eq('id', above.id).eq('tenant_id', tenantId)
      ])
      await loadZones()
    } catch (err) {
      console.error('Error reordering:', err)
    }
  }

  const handleMoveDown = async (zone) => {
    const idx = zones.findIndex(z => z.id === zone.id)
    if (idx >= zones.length - 1) return
    const below = zones[idx + 1]
    try {
      await Promise.all([
        supabase.from('table_zones').update({ order_index: below.order_index }).eq('id', zone.id).eq('tenant_id', tenantId),
        supabase.from('table_zones').update({ order_index: zone.order_index }).eq('id', below.id).eq('tenant_id', tenantId)
      ])
      await loadZones()
    } catch (err) {
      console.error('Error reordering:', err)
    }
  }

  const startEdit = (zone) => {
    setEditing(zone.id)
    setCreating(false)
    setFormData({
      name: zone.name,
      description: zone.description || '',
      color: zone.color || '#6366f1',
      icon: zone.icon || 'map-pin'
    })
  }

  const cancelEdit = () => {
    setEditing(null)
    setCreating(false)
    setFormData(DEFAULT_FORM)
  }

  // ── Guard: super admin without tenant selected ──────────────────────────
  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={MapPin}
          message="Utiliza el selector en la barra superior para gestionar las zonas de un tenant específico"
        />
      )
    }
    return (
      <div className="p-6 text-center py-12">
        <p className="text-gray-600">No se pudo cargar la información del local.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zonas / Ambientes</h1>
          <p className="text-gray-600 text-sm mt-1">
            Organiza las mesas por zonas o ambientes (Salón, Terraza, Bar, etc.)
          </p>
        </div>
        {!creating && !editing && (
          <button
            onClick={() => { setCreating(true); setEditing(null); setFormData(DEFAULT_FORM) }}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Zona</span>
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <ZoneForm
          formData={formData}
          setFormData={setFormData}
          onSave={handleCreate}
          onCancel={cancelEdit}
          saving={saving}
          title="Nueva Zona"
        />
      )}

      {/* Zones list */}
      {zones.length === 0 && !creating ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay zonas creadas</p>
          <p className="text-gray-400 text-sm mt-1">
            Crea zonas para organizar tus mesas por ambiente
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone, idx) => (
            <div key={zone.id}>
              {editing === zone.id ? (
                <ZoneForm
                  formData={formData}
                  setFormData={setFormData}
                  onSave={() => handleUpdate(zone.id)}
                  onCancel={cancelEdit}
                  saving={saving}
                  title="Editar Zona"
                />
              ) : (
                <ZoneRow
                  zone={zone}
                  tableCount={tableCounts[zone.id] || 0}
                  isFirst={idx === 0}
                  isLast={idx === zones.length - 1}
                  onEdit={() => startEdit(zone)}
                  onDelete={() => handleDelete(zone)}
                  onMoveUp={() => handleMoveUp(zone)}
                  onMoveDown={() => handleMoveDown(zone)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {zones.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{zones.length}</span> zona{zones.length !== 1 ? 's' : ''} ·{' '}
            <span className="font-medium">
              {Object.values(tableCounts).reduce((a, b) => a + b, 0)}
            </span>{' '}
            mesa{Object.values(tableCounts).reduce((a, b) => a + b, 0) !== 1 ? 's' : ''} asignadas
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ZoneRow = ({ zone, tableCount, isFirst, isLast, onEdit, onDelete, onMoveUp, onMoveDown }) => {
  const iconMeta = ZONE_ICONS.find(icon => icon.value === zone.icon)
  const ZoneIcon = iconMeta?.Icon || MapPin

  return (
    <div className="flex items-center bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
    {/* Color swatch */}
    <div
      className="w-4 h-10 rounded mr-4 flex-shrink-0"
      style={{ backgroundColor: zone.color || '#6366f1' }}
    />

      {/* Icon */}
      <div className="mr-3 text-gray-500">
        <ZoneIcon className="w-4 h-4" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
      <p className="font-semibold text-gray-900 truncate">{zone.name}</p>
      {zone.description && (
        <p className="text-xs text-gray-500 truncate">{zone.description}</p>
      )}
      </div>

      {/* Table count badge */}
      <span className="ml-3 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
      {tableCount} mesa{tableCount !== 1 ? 's' : ''}
      </span>

      {/* Reorder buttons */}
      <div className="flex flex-col ml-3">
      <button
        onClick={onMoveUp}
        disabled={isFirst}
        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
        title="Subir"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast}
        className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed"
        title="Bajar"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-2 ml-3">
      <button
        onClick={onEdit}
        className="p-2 text-gray-500 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
        title="Editar"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      </div>
    </div>
  )
}

const ZoneForm = ({ formData, setFormData, onSave, onCancel, saving, title }) => (
  <div className="bg-white rounded-lg border-2 border-primary p-5 mb-4 shadow-sm">
    <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>

    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Salón Principal, Terraza, Bar, VIP"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={100}
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Breve descripción del ambiente"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          maxLength={200}
        />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {ZONE_COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFormData({ ...formData, color: c.value })}
              title={c.label}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                formData.color === c.value
                  ? 'border-gray-900 scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Ícono</label>
        <div className="flex flex-wrap gap-2">
          {ZONE_ICONS.map(icon => {
            const IconComponent = icon.Icon
            const isSelected = formData.icon === icon.value
            return (
              <button
                key={icon.value}
                type="button"
                onClick={() => setFormData({ ...formData, icon: icon.value })}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{icon.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="flex space-x-3 mt-5">
      <button
        onClick={onCancel}
        disabled={saving}
        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <span className="flex items-center justify-center space-x-1">
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </span>
      </button>
      <button
        onClick={onSave}
        disabled={saving || !formData.name.trim()}
        className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {saving ? (
          <span className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <span>Guardando...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-1">
            <Save className="w-4 h-4" />
            <span>Guardar</span>
          </span>
        )}
      </button>
    </div>
  </div>
)

export default ZonesManager
