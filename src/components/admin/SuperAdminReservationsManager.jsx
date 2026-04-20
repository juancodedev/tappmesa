import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Filter,
  RefreshCw,
  Building2,
  Search
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminReservationsManager = () => {
  const [reservations, setReservations] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar tenant/filtro
  }, [selectedTenantId, statusFilter, selectedDate])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (tenantsError) throw tenantsError
      setTenants(tenantsData || [])

      // Load reservations
      let query = supabase
        .from('reservations')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          )
        `)
        .order('reservation_date', { ascending: false })
        .order('reservation_time', { ascending: true })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (selectedDate) {
        query = query.eq('reservation_date', selectedDate)
      }

      const { data: reservationsData, error: reservationsError } = await query.limit(500)

      if (reservationsError) throw reservationsError

      setReservations(reservationsData || [])
    } catch (error) {
      console.error('Error loading reservations:', error)
      alert('Error al cargar reservas: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pendiente',
        dotColor: 'bg-yellow-500'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: 'Confirmada',
        dotColor: 'bg-green-500'
      },
      cancelled: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        text: 'Cancelada',
        dotColor: 'bg-red-500'
      },
      completed: {
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-800',
        text: 'Completada',
        dotColor: 'bg-blue-500'
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString.slice(0, 5)
  }

  const getTodayReservations = () => {
    const today = new Date().toISOString().split('T')[0]
    return reservations.filter(r => r.reservation_date === today && r.status !== 'cancelled')
  }

  const getUpcomingReservations = () => {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    return reservations.filter(r =>
      r.reservation_date >= today &&
      r.reservation_date <= nextWeekStr &&
      r.status !== 'cancelled'
    )
  }

  // Filter by search term
  const filteredReservations = reservations.filter(reservation => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      reservation.customer_name?.toLowerCase().includes(term) ||
      reservation.customer_phone?.includes(term) ||
      reservation.customer_email?.toLowerCase().includes(term) ||
      reservation.tenant?.name?.toLowerCase().includes(term)
    )
  })

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando reservas...</p>
      </div>
    )
  }

  const todayReservations = getTodayReservations()
  const upcomingReservations = getUpcomingReservations()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservas del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todas las reservas de todos los tenants
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
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono..."
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
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Completadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reservas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {filteredReservations.length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Por Confirmar</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {filteredReservations.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hoy</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {todayReservations.length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximos 7 días</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {upcomingReservations.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">
            No se encontraron reservas con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReservations.map((reservation) => {
                  const statusInfo = getStatusInfo(reservation.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.customer_name}
                            </div>
                            {reservation.special_requests && (
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Solicitudes especiales
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-1" />
                          {reservation.customer_phone}
                        </div>
                        {reservation.customer_email && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <Mail className="h-3 w-3 text-gray-400 mr-1" />
                            {reservation.customer_email}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          {formatDate(reservation.reservation_date)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          {formatTime(reservation.reservation_time)}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reservation.table_number || '-'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.tenant?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{reservation.tenant?.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotColor}`}></div>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.text}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminReservationsManager
