import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../context/TenantContext'
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Mail,
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Plus,
  Edit,
  Eye
} from 'lucide-react'

const ReservationsManager = () => {
  const { tenant: currentTenant } = useTenant()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (currentTenant) {
      loadReservations()
      // Actualizar cada minuto para reservas en tiempo real
      const interval = setInterval(loadReservations, 60000)
      return () => clearInterval(interval)
    }
  }, [currentTenant, statusFilter, dateFilter])

  const loadReservations = async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      
      let query = supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })

      // Filtrar por estado
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // Filtrar por fecha
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      switch (dateFilter) {
        case 'today':
          query = query.eq('reservation_date', todayStr)
          break
        case 'tomorrow':
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          query = query.eq('reservation_date', tomorrow.toISOString().split('T')[0])
          break
        case 'week':
          const weekFromNow = new Date(today)
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          query = query
            .gte('reservation_date', todayStr)
            .lte('reservation_date', weekFromNow.toISOString().split('T')[0])
          break
        case 'future':
          query = query.gte('reservation_date', todayStr)
          break
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando reservas:', error)
        setReservations([])
        return
      }

      setReservations(data || [])
      console.log('✅ Reservas cargadas:', data?.length || 0)
      
    } catch (error) {
      console.error('Error loading reservations:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId, newStatus) => {
    if (!reservationId || updating) return

    try {
      setUpdating(true)
      console.log(`Actualizando reserva ${reservationId} a estado: ${newStatus}`)

      const { data, error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)
        .eq('tenant_id', currentTenant.id)
        .select()

      if (error) {
        console.error('Error de Supabase:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('No se encontró la reserva')
      }
      
      console.log('✅ Estado de reserva actualizado:', data[0])
      
      // Actualizar estado local inmediatamente
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: newStatus }
            : reservation
        )
      )

      // Recargar después de un momento
      setTimeout(loadReservations, 1000)
      
    } catch (error) {
      console.error('Error updating reservation status:', error)
      alert(`Error al actualizar la reserva: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada'
      case 'cancelled': return 'Cancelada'
      case 'completed': return 'Completada'
      case 'no_show': return 'No se presentó'
      default: return status
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return CheckCircle
      case 'cancelled': return XCircle
      case 'completed': return CheckCircle
      case 'no_show': return AlertCircle
      default: return Clock
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString.slice(0, 5) // HH:MM
  }

  const isReservationToday = (dateString) => {
    const today = new Date().toISOString().split('T')[0]
    return dateString === today
  }

  const isReservationPast = (dateString, timeString) => {
    const now = new Date()
    const reservationDateTime = new Date(`${dateString}T${timeString}`)
    return reservationDateTime < now
  }

  const getDateFilterText = (filter) => {
    switch (filter) {
      case 'today': return 'Hoy'
      case 'tomorrow': return 'Mañana'
      case 'week': return 'Esta semana'
      case 'future': return 'Futuras'
      case 'all': return 'Todas'
      default: return filter
    }
  }

  const filteredReservations = reservations.filter(reservation => {
    if (statusFilter === 'all') return true
    return reservation.status === statusFilter
  })

  const getReservationStats = () => {
    const stats = {
      today: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0
    }

    const todayStr = new Date().toISOString().split('T')[0]
    
    reservations.forEach(reservation => {
      if (reservation.reservation_date === todayStr) {
        stats.today++
      }
      if (reservation.status === 'confirmed') {
        stats.confirmed++
      }
      if (reservation.status === 'cancelled') {
        stats.cancelled++
      }
      if (reservation.status === 'completed') {
        stats.completed++
      }
    })

    return stats
  }

  const stats = getReservationStats()

  if (!currentTenant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenant disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del local. Verifica que estés en el dominio correcto.
          </p>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h1>
          <p className="text-gray-600">
            Administra las reservas de {currentTenant?.name || 'tu local'}
          </p>
        </div>
        <button
          onClick={loadReservations}
          disabled={loading}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Calendar className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
            <p className="text-sm text-gray-600">Hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-gray-600">Confirmadas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-sm text-gray-600">Canceladas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmed">Confirmadas</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="no_show">No se presentaron</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="tomorrow">Mañana</option>
              <option value="week">Esta semana</option>
              <option value="future">Futuras</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReservations.map((reservation) => {
          const StatusIcon = getStatusIcon(reservation.status)
          const isPast = isReservationPast(reservation.reservation_date, reservation.reservation_time)
          
          return (
            <div 
              key={reservation.id} 
              className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden ${getStatusColor(reservation.status)} ${isPast && reservation.status === 'confirmed' ? 'opacity-75' : ''}`}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900">
                    {reservation.customer_name}
                  </h3>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(reservation.status)}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{getStatusText(reservation.status)}</span>
                  </div>
                </div>
                
                {isReservationToday(reservation.reservation_date) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 mb-2">
                    <span className="text-sm font-medium text-blue-800">📅 HOY</span>
                  </div>
                )}
              </div>

              {/* Fecha y hora */}
              <div className="p-4 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {formatDate(reservation.reservation_date)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">
                      {formatTime(reservation.reservation_time)}
                    </span>
                    {isPast && reservation.status === 'confirmed' && (
                      <span className="text-red-500 text-xs">(Pasada)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{reservation.party_size} persona{reservation.party_size > 1 ? 's' : ''}</span>
                    {reservation.table_number && (
                      <span className="text-gray-500">• {reservation.table_number}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="p-4 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{reservation.customer_phone}</span>
                  </div>
                  {reservation.customer_email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{reservation.customer_email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Solicitudes especiales */}
              {reservation.special_requests && (
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Solicitudes especiales:</h4>
                  <p className="text-sm text-gray-600">{reservation.special_requests}</p>
                </div>
              )}

              {/* Actions */}
              <div className="p-4">
                {reservation.status === 'confirmed' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateReservationStatus(reservation.id, 'completed')}
                      disabled={updating}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Completar'}
                    </button>
                    <button
                      onClick={() => updateReservationStatus(reservation.id, 'no_show')}
                      disabled={updating}
                      className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'No vino'}
                    </button>
                    <button
                      onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                      disabled={updating}
                      className="col-span-2 mt-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {updating ? 'Actualizando...' : 'Cancelar'}
                    </button>
                  </div>
                )}

                {(reservation.status === 'completed' || reservation.status === 'cancelled' || reservation.status === 'no_show') && (
                  <button
                    onClick={() => setSelectedReservation(reservation)}
                    className="w-full border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Detalles</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay reservas
          </h3>
          <p className="text-gray-600">
            {statusFilter === 'all' && dateFilter === 'all' 
              ? 'Aún no se han realizado reservas' 
              : `No hay reservas ${statusFilter !== 'all' ? getStatusText(statusFilter).toLowerCase() : ''} ${dateFilter !== 'all' ? 'para ' + getDateFilterText(dateFilter).toLowerCase() : ''}`
            }
          </p>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles de la Reserva
              </h3>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cliente:</h4>
                <p className="text-gray-600">{selectedReservation.customer_name}</p>
                <p className="text-gray-600">{selectedReservation.customer_phone}</p>
                {selectedReservation.customer_email && (
                  <p className="text-gray-600">{selectedReservation.customer_email}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reserva:</h4>
                <p className="text-gray-600">
                  {formatDate(selectedReservation.reservation_date)}
                </p>
                <p className="text-gray-600">
                  {formatTime(selectedReservation.reservation_time)}
                </p>
                <p className="text-gray-600">
                  {selectedReservation.party_size} persona{selectedReservation.party_size > 1 ? 's' : ''}
                </p>
                {selectedReservation.table_number && (
                  <p className="text-gray-600">{selectedReservation.table_number}</p>
                )}
              </div>

              {selectedReservation.special_requests && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Solicitudes especiales:</h4>
                  <p className="text-gray-600">{selectedReservation.special_requests}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Estado:</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReservation.status)}`}>
                  {getStatusText(selectedReservation.status)}
                </span>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Fecha de creación:</h4>
                <p className="text-gray-600">
                  {new Date(selectedReservation.created_at).toLocaleString('es-CL')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedReservation(null)}
              className="w-full mt-6 bg-primary text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsManager