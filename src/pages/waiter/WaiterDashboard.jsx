import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { supabase } from '../../lib/supabase'
import {
  Grid,
  List,
  Plus,
  Calendar,
  Search,
  LogOut,
  RefreshCw,
  Users
} from 'lucide-react'
import TablesGrid from './components/TablesGrid'
import ActiveOrdersPanel from './components/ActiveOrdersPanel'
import CreateOrderModal from './components/CreateOrderModal'
import CreateReservationModal from './components/CreateReservationModal'

const WaiterDashboard = () => {
  const { tenant, loading: tenantLoading } = useTenant()
  const [view, setView] = useState('grid') // 'grid' or 'list'
  const [tables, setTables] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showCreateReservation, setShowCreateReservation] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (tenant) {
      loadData()

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadData()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [tenant])

  const loadData = async () => {
    if (!tenant) return

    try {
      // Load tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('number', { ascending: true })

      if (tablesError) throw tablesError

      // Load active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('table_sessions')
        .select(`
          *,
          table:tables (
            id,
            number,
            capacity
          ),
          orders (
            id,
            status,
            total,
            created_at
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')

      if (sessionsError) throw sessionsError

      setTables(tablesData || [])
      setActiveSessions(sessionsData || [])
    } catch (error) {
      // console.error('Error loading waiter data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = (table) => {
    setSelectedTable(table)
    setShowCreateOrder(true)
  }

  const handleRefresh = () => {
    setLoading(true)
    loadData()
  }

  const filteredTables = tables.filter(table =>
    table.number.toString().includes(searchTerm) ||
    table.unique_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (tenantLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error de configuración
          </h1>
          <p className="text-gray-600">
            No se pudo cargar la información del local
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Users className="w-7 h-7 text-primary" />
                <span>Panel Garzón</span>
              </h1>
              <p className="text-sm text-gray-600">{tenant.name}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={() => window.location.href = '/admin'}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateReservation(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Nueva Reserva</span>
              </button>

              <button
                onClick={() => setShowCreateOrder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Pedido</span>
              </button>

              {/* View Toggle */}
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded ${view === 'grid' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                  title="Vista cuadrícula"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded ${view === 'list' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
                  title="Vista lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mesas Totales</p>
                <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Grid className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sesiones Activas</p>
                <p className="text-2xl font-bold text-blue-600">{activeSessions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pedidos Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeSessions.reduce((sum, s) => sum + (s.orders?.length || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tables Grid/List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TablesGrid
              tables={filteredTables}
              activeSessions={activeSessions}
              view={view}
              onCreateOrder={handleCreateOrder}
              onRefresh={loadData}
            />
          </div>

          <div className="lg:col-span-1">
            <ActiveOrdersPanel
              activeSessions={activeSessions}
              onRefresh={loadData}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateOrder && (
        <CreateOrderModal
          tenant={tenant}
          tables={tables}
          selectedTable={selectedTable}
          onClose={() => {
            setShowCreateOrder(false)
            setSelectedTable(null)
          }}
          onSuccess={() => {
            loadData()
            setShowCreateOrder(false)
            setSelectedTable(null)
          }}
        />
      )}

      {showCreateReservation && (
        <CreateReservationModal
          tenant={tenant}
          onClose={() => setShowCreateReservation(false)}
          onSuccess={() => {
            loadData()
            setShowCreateReservation(false)
          }}
        />
      )}
    </div>
  )
}

export default WaiterDashboard
