import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Coffee,
  Search,
  Building2,
  QrCode,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminTablesManager = () => {
  const [tables, setTables] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [selectedTenantId, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load tables
      let query = supabase
        .from('tables')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      const { data: tablesData, error: tablesError } = await query

      if (tablesError) throw tablesError

      // Load tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name', { ascending: true })

      setTables(tablesData || [])
      setTenants(tenantsData || [])
    } catch (error) {
      console.error('Error loading tables:', error)
      alert(`Error al cargar mesas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredTables = tables.filter(table => {
    const matchesSearch =
      table.number?.toString().includes(searchTerm) ||
      table.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.unique_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  // Calculate stats
  const stats = {
    total: filteredTables.length,
    active: filteredTables.filter(t => t.is_active).length,
    withQR: filteredTables.filter(t => t.unique_code).length,
    tenantCount: new Set(filteredTables.map(t => t.tenant_id)).size
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando mesas...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mesas del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todas las mesas de todos los tenants
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

        {/* Tenant Selector */}
        <div className="mt-4">
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar mesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mesas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Coffee className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Código QR</p>
              <p className="text-2xl font-bold text-orange-600">{stats.withQR}</p>
            </div>
            <QrCode className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tenants</p>
              <p className="text-2xl font-bold text-purple-600">{stats.tenantCount}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron mesas</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-lg shadow-md border-2 overflow-hidden hover:shadow-lg transition-shadow ${
                table.is_active ? 'border-gray-200' : 'border-red-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Coffee className="h-5 w-5" />
                    <span className="font-bold text-lg">Mesa {table.number}</span>
                  </div>
                  {table.is_active ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                </div>
                {table.name && (
                  <p className="text-sm opacity-90 mt-1">{table.name}</p>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Tenant Info */}
                <div className="flex items-center text-sm">
                  <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">{table.tenant?.name}</div>
                    <div className="text-xs text-gray-500">@{table.tenant?.slug}</div>
                  </div>
                </div>

                {/* Capacity */}
                {table.max_capacity && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span>Capacidad: {table.max_capacity} personas</span>
                  </div>
                )}

                {/* QR Code */}
                {table.unique_code ? (
                  <div className="bg-green-50 border border-green-200 rounded p-2">
                    <div className="flex items-center text-sm text-green-800">
                      <QrCode className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Código QR</div>
                        <div className="text-xs font-mono">{table.unique_code}</div>
                      </div>
                    </div>
                    {table.qr_code_expires_at && (
                      <div className="text-xs text-green-600 mt-1">
                        Expira: {formatDate(table.qr_code_expires_at)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded p-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <QrCode className="h-4 w-4 mr-2" />
                      <span>Sin código QR</span>
                    </div>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Creada: {formatDate(table.created_at)}</span>
                </div>

                {/* Status Badge */}
                <div className="pt-2">
                  {table.is_active ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactiva
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SuperAdminTablesManager
