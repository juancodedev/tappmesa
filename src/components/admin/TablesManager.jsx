import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  QrCode, 
  Eye, 
  Coffee,
  Users,
  MapPin,
  MoreVertical,
  Save,
  X
} from 'lucide-react'

const TablesManager = () => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [saving, setSaving] = useState(false)

  // Simular tenant ID - en producción vendría del contexto
  const [currentTenant, setCurrentTenant] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    capacity: 2,
    location: 'interior'
  })

  useEffect(() => {
    loadTenant()
  }, [])

  useEffect(() => {
    if (currentTenant) {
      loadTables()
    }
  }, [currentTenant])

  const loadTenant = async () => {
    try {
      // Cargar el tenant "Café Central" de Supabase
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', 'cafe-central')
        .single()

      if (error) {
        console.warn('No se pudo cargar tenant desde Supabase:', error)
        // Usar datos mock con UUID válido si no funciona Supabase
        setCurrentTenant({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Café Central (Demo)',
          slug: 'cafe-central'
        })
      } else {
        setCurrentTenant(data)
        console.log('✅ Tenant cargado:', data.name)
      }
    } catch (error) {
      console.error('Error loading tenant:', error)
      setCurrentTenant({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Café Central (Demo)',
        slug: 'cafe-central'
      })
    }
  }

  const loadTables = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('number')

      if (error) {
        console.warn('No se pudo cargar mesas desde Supabase:', error)
        // Usar datos de ejemplo si falla
        setTables([
          { id: 1, number: 'Mesa 1', capacity: 2, location: 'interior', status: 'available', unique_code: 'ABC12345', is_active: true },
          { id: 2, number: 'Mesa 2', capacity: 4, location: 'interior', status: 'occupied', unique_code: 'DEF67890', is_active: true },
          { id: 3, number: 'Mesa 3', capacity: 6, location: 'terraza', status: 'reserved', unique_code: 'GHI13579', is_active: true },
          { id: 4, number: 'Mesa 4', capacity: 2, location: 'barra', status: 'maintenance', unique_code: 'JKL24680', is_active: false },
        ])
      } else {
        setTables(data || [])
        console.log('✅ Mesas cargadas:', data?.length || 0)
      }
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setLoading(false)
    }
  }

  // Función para generar código único
  const generateUniqueCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleAddTable = () => {
    setSelectedTable(null)
    setFormData({
      number: `Mesa ${tables.length + 1}`,
      capacity: 2,
      location: 'interior'
    })
    setShowAddModal(true)
  }

  const handleEditTable = (table) => {
    setSelectedTable(table)
    setFormData({
      number: table.number,
      capacity: table.capacity,
      location: table.location
    })
    setShowAddModal(true)
    setShowActionsMenu(null)
  }

  const handleSaveTable = async () => {
    try {
      setSaving(true)

      // Validaciones
      if (!formData.number.trim()) {
        alert('El número de mesa es requerido')
        return
      }

      if (formData.capacity < 1 || formData.capacity > 20) {
        alert('La capacidad debe estar entre 1 y 20 personas')
        return
      }

      if (selectedTable) {
        // Editar mesa existente
        const { error } = await supabase
          .from('tables')
          .update({
            number: formData.number.trim(),
            capacity: parseInt(formData.capacity),
            location: formData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTable.id)

        if (error) throw error
        console.log('✅ Mesa actualizada')
      } else {
        // Verificar que no exista una mesa con el mismo número
        const { data: existingTable } = await supabase
          .from('tables')
          .select('id')
          .eq('tenant_id', currentTenant.id)
          .eq('number', formData.number.trim())
          .single()

        if (existingTable) {
          alert('Ya existe una mesa con ese número')
          return
        }

        // Crear nueva mesa
        const { error } = await supabase
          .from('tables')
          .insert({
            tenant_id: currentTenant.id,
            number: formData.number.trim(),
            capacity: parseInt(formData.capacity),
            location: formData.location,
            unique_code: generateUniqueCode(),
            status: 'available',
            is_active: true
          })

        if (error) throw error
        console.log('✅ Mesa creada')
      }

      // Recargar mesas
      await loadTables()
      setShowAddModal(false)
      
    } catch (error) {
      console.error('Error saving table:', error)
      alert('Error al guardar la mesa: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTable = async (tableId) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error
      
      console.log('✅ Mesa eliminada')
      await loadTables()
    } catch (error) {
      console.error('Error deleting table:', error)
      alert('Error al eliminar la mesa: ' + error.message)
    }
    setShowActionsMenu(null)
  }

  const handleViewQR = (table) => {
    // Abrir página de QR en nueva pestaña
    const url = `/admin/qr?table=${table.id}`
    window.open(url, '_blank')
    setShowActionsMenu(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-yellow-100 text-yellow-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Ocupada'
      case 'reserved': return 'Reservada'
      case 'maintenance': return 'Mantenimiento'
      default: return status
    }
  }

  const getLocationText = (location) => {
    switch (location) {
      case 'interior': return 'Interior'
      case 'terraza': return 'Terraza'
      case 'barra': return 'Barra'
      default: return location
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600">
            Administra las mesas de {currentTenant?.name || 'tu local'}
          </p>
        </div>
        <button
          onClick={handleAddTable}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Mesa</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            <p className="text-sm text-gray-600">Total Mesas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.status === 'available').length}
            </p>
            <p className="text-sm text-gray-600">Disponibles</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {tables.filter(t => t.status === 'occupied').length}
            </p>
            <p className="text-sm text-gray-600">Ocupadas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {tables.filter(t => t.status === 'reserved').length}
            </p>
            <p className="text-sm text-gray-600">Reservadas</p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{table.number}</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === table.id ? null : table.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Actions Menu */}
                  {showActionsMenu === table.id && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleViewQR(table)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Ver QR</span>
                        </button>
                        <button
                          onClick={() => handleEditTable(table)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                  {getStatusText(table.status)}
                </span>
                {!table.is_active && (
                  <span className="text-xs text-gray-500">Inactiva</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{table.capacity} personas</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{getLocationText(table.location)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Código único:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {table.unique_code}
                </code>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewQR(table)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR</span>
                </button>
                <button
                  onClick={() => handleEditTable(table)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedTable ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Número de Mesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Mesa 1, Mesa A, VIP 1"
                />
              </div>
              
              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="interior">Interior</option>
                  <option value="terraza">Terraza</option>
                  <option value="barra">Barra</option>
                  <option value="privado">Salón Privado</option>
                  <option value="exterior">Exterior</option>
                </select>
              </div>

              {/* Información adicional */}
              {!selectedTable && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>📝 Nota:</strong> Se generará automáticamente un código QR único para esta mesa.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTable}
                disabled={saving || !formData.number.trim()}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{selectedTable ? 'Actualizar Mesa' : 'Crear Mesa'}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Validaciones */}
            <div className="mt-4 text-xs text-gray-500">
              <p>* Campos obligatorios</p>
              {selectedTable && (
                <p>💡 El código QR existente se mantendrá sin cambios</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsMenu(null)}
        />
      )}
    </div>
  )
}

export default TablesManager