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
  MoreVertical
} from 'lucide-react'

const TablesManager = () => {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)

  // Simular tenant ID - en producción vendría del contexto
  const tenantId = 'your-tenant-id'

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('number')

      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error('Error loading tables:', error)
      // Datos de ejemplo si falla
      setTables([
        { id: 1, number: 'Mesa 1', capacity: 2, location: 'interior', status: 'available', unique_code: 'ABC12345', is_active: true },
        { id: 2, number: 'Mesa 2', capacity: 4, location: 'interior', status: 'occupied', unique_code: 'DEF67890', is_active: true },
        { id: 3, number: 'Mesa 3', capacity: 6, location: 'terraza', status: 'reserved', unique_code: 'GHI13579', is_active: true },
        { id: 4, number: 'Mesa 4', capacity: 2, location: 'barra', status: 'maintenance', unique_code: 'JKL24680', is_active: false },
      ])
    } finally {
      setLoading(false)
    }
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

  const handleAddTable = () => {
    setSelectedTable(null)
    setShowAddModal(true)
  }

  const handleEditTable = (table) => {
    setSelectedTable(table)
    setShowAddModal(true)
    setShowActionsMenu(null)
  }

  const handleDeleteTable = async (tableId) => {
    if (confirm('¿Estás seguro de eliminar esta mesa?')) {
      try {
        // Aquí iría la lógica de eliminación
        console.log('Deleting table:', tableId)
        await loadTables()
      } catch (error) {
        console.error('Error deleting table:', error)
      }
    }
    setShowActionsMenu(null)
  }

  const handleViewQR = (table) => {
    // Abrir modal de QR o redirigir a la página de QR
    const qrUrl = `http://cafe-central.tappmesa.local:5173/${table.unique_code}/`
    window.open(`/admin/qr?table=${table.id}`, '_blank')
    setShowActionsMenu(null)
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
          <p className="text-gray-600">Administra las mesas de tu local</p>
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

      {/* Add/Edit Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedTable ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
            </h3>
            <p className="text-gray-600 mb-6">
              Funcionalidad en desarrollo...
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Guardar
              </button>
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