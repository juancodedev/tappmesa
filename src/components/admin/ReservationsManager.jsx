import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage'
import logger from '../../utils/logger'
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
  Edit,
  X
} from 'lucide-react'

const ReservationsManager = () => {
  const { tenant } = useTenant()
  const { isSuperAdmin } = useAuth()
  const superAdminContext = useContext(SuperAdminContext)

  // Get tenant ID based on user type
  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId
    }
    return tenant?.id || null
  }

  const tenantId = getTenantId()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [editingReservation, setEditingReservation] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    if (tenantId) {
      loadReservations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/cambiar tenant
  }, [tenantId, filter, selectedDate, superAdminContext?.selectedTenantId])

  const loadReservations = async () => {
    if (!tenantId) return

    try {
      setLoading(true)

      let query = supabase
        .from('reservations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (selectedDate) {
        query = query.eq('reservation_date', selectedDate)
      }

      const { data, error } = await query

      if (error) throw error

      setReservations(data || [])
    } catch (error) {
      logger.error('Error loading reservations:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)

      if (error) throw error

      await loadReservations()
    } catch (error) {
      logger.error('Error updating reservation:', error)
      alert('Error al actualizar la reserva')
    }
  }

  const openEditModal = (reservation) => {
    setEditingReservation({ ...reservation })
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingReservation(null)
    setShowEditModal(false)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editingReservation) return

    try {
      const reservationData = {
        tenant_id: tenantId,
        customer_name: editingReservation.customer_name,
        customer_phone: editingReservation.customer_phone,
        customer_email: editingReservation.customer_email || null,
        reservation_date: editingReservation.reservation_date,
        reservation_time: editingReservation.reservation_time,
        party_size: parseInt(editingReservation.party_size),
        table_number: editingReservation.table_number || null,
        special_requests: editingReservation.special_requests || null,
        status: editingReservation.status || 'confirmed',
        updated_at: new Date().toISOString()
      }

      if (editingReservation.id) {
        // Actualizar existente
        const { error } = await supabase
          .from('reservations')
          .update(reservationData)
          .eq('id', editingReservation.id)
          .eq('tenant_id', tenantId)

        if (error) throw error
      } else {
        // Crear nueva
        const { error } = await supabase
          .from('reservations')
          .insert([reservationData])

        if (error) throw error
      }

      await loadReservations()
      closeEditModal()
    } catch (error) {
      logger.error('Error saving reservation:', error)
      alert('Error al guardar la reserva: ' + error.message)
    }
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Pendiente',
        dotColor: 'bg-yellow-500'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Confirmada',
        dotColor: 'bg-green-500'
      },
      cancelled: {
        icon: XCircle,
        color: 'bg-accent-100 text-accent-800 border-accent-200',
        text: 'Cancelada',
        dotColor: 'bg-accent-500'
      },
      completed: {
        icon: CheckCircle,
        color: 'bg-primary-100 text-primary-800 border-primary-200',
        text: 'Completada',
        dotColor: 'bg-primary-500'
      }
    }
    return statusMap[status] || statusMap.pending
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  // Show message if no tenant is available
  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={Calendar}
          message="Utiliza el selector en la barra superior para ver las reservas de un tenant específico"
        />
      )
    }

    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay información disponible
          </h3>
          <p className="text-gray-600">
            No se pudo cargar la información del local
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const todayReservations = getTodayReservations()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Reservas</h1>
          <p className="text-gray-600">
            {isSuperAdmin && superAdminContext?.selectedTenant
              ? `Administra las reservas de ${superAdminContext.selectedTenant.name}`
              : `Administra las reservas de ${tenant?.name || 'tu local'}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setEditingReservation({
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                reservation_date: today,
                reservation_time: '12:00',
                party_size: 2,
                status: 'confirmed'
              })
              setShowEditModal(true)
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" />
            <span>Nueva Reserva</span>
          </button>
          <button
            onClick={loadReservations}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
            <p className="text-sm text-gray-600">Total Reservas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-700">{todayReservations.length}</p>
            <p className="text-sm text-gray-600">Hoy</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'confirmed').length}
            </p>
            <p className="text-sm text-gray-600">Confirmadas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {reservations.filter(r => r.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Todas</button>
            <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Pendientes</button>
            <button onClick={() => setFilter('confirmed')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'confirmed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Confirmadas</button>
            <button onClick={() => setFilter('cancelled')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'cancelled' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Canceladas</button>
          </div>

          <div className="md:ml-auto">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
            {selectedDate && (<button onClick={() => setSelectedDate('')} className="ml-2 text-sm text-gray-600 hover:text-gray-900">Limpiar</button>)}
          </div>
        </div>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reservas</h3>
          <p className="text-gray-600">{filter !== 'all' || selectedDate ? 'No se encontraron reservas con los filtros seleccionados' : 'Las reservas que recibas aparecerán aquí'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reservations.map((reservation) => {
            const statusInfo = getStatusInfo(reservation.status)
            const StatusIcon = statusInfo.icon

            return (
              <div key={reservation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${statusInfo.color}`}>
                        <div className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`}></div>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.text}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center space-x-2 text-gray-700 mb-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold">{reservation.customer_name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${reservation.customer_phone}`} className="hover:text-primary">{reservation.customer_phone}</a>
                        </div>
                        {reservation.customer_email && (
                          <div className="flex items-center space-x-2 text-gray-600 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <a href={`mailto:${reservation.customer_email}`} className="hover:text-primary">{reservation.customer_email}</a>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-gray-700 mb-2">
                          <Calendar className="w-5 h-5 text-gray-400" />
                          <span className="font-medium capitalize">{formatDate(reservation.reservation_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTime(reservation.reservation_time)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{reservation.party_size} {reservation.party_size === 1 ? 'persona' : 'personas'}</span>
                        </div>
                      </div>
                    </div>

                    {reservation.special_requests && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Solicitudes especiales:</p>
                            <p className="text-sm text-gray-600">{reservation.special_requests}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {reservation.table_number && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Mesa asignada:</span> {reservation.table_number}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
                      <button onClick={() => openEditModal(reservation)} className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-1">
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    )}
                    {reservation.status === 'pending' && (
                      <button onClick={() => updateReservationStatus(reservation.id, 'confirmed')} className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmar</span>
                      </button>
                    )}
                    {reservation.status === 'confirmed' && (
                      <button onClick={() => updateReservationStatus(reservation.id, 'completed')} className="px-3 py-1.5 bg-secondary-600 text-white text-sm font-medium rounded-lg hover:bg-secondary-700 transition-colors">Completar</button>
                    )}
                    {reservation.status !== 'cancelled' && (
                      <button onClick={() => updateReservationStatus(reservation.id, 'cancelled')} className="px-3 py-1.5 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700 transition-colors flex items-center space-x-1">
                        <XCircle className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingReservation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEditModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingReservation.id ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              <button onClick={closeEditModal} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingReservation.customer_name}
                      onChange={(e) => setEditingReservation({ ...editingReservation, customer_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      required
                      value={editingReservation.customer_phone}
                      onChange={(e) => setEditingReservation({ ...editingReservation, customer_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editingReservation.customer_email || ''}
                      onChange={(e) => setEditingReservation({ ...editingReservation, customer_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Mesa
                    </label>
                    <input
                      type="text"
                      value={editingReservation.table_number || ''}
                      onChange={(e) => setEditingReservation({ ...editingReservation, table_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingReservation.reservation_date}
                      onChange={(e) => setEditingReservation({ ...editingReservation, reservation_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora *
                    </label>
                    <input
                      type="time"
                      required
                      value={editingReservation.reservation_time}
                      onChange={(e) => setEditingReservation({ ...editingReservation, reservation_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Personas *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingReservation.party_size}
                      onChange={(e) => setEditingReservation({ ...editingReservation, party_size: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solicitudes Especiales
                  </label>
                  <textarea
                    rows="3"
                    value={editingReservation.special_requests || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, special_requests: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Alergias, preferencias de ubicación, etc."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReservationsManager
