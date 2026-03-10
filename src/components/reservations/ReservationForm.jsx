import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Calendar, Clock, Users, Phone, Mail, User, MessageSquare, CheckCircle, AlertCircle, Armchair } from 'lucide-react'

const ReservationForm = ({ tenantId, tenantName, onSuccess }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_date: '',
    reservation_time: '',
    party_size: 2,
    table_id: '',
    special_requests: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [availableTables, setAvailableTables] = useState([])
  const [loadingTables, setLoadingTables] = useState(false)

  // Cargar mesas cuando el tenant está disponible
  useEffect(() => {
    if (tenantId) {
      loadTables()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/cambiar tenant
  }, [tenantId])

  // Recargar mesas cuando cambia party_size, date o time
  useEffect(() => {
    if (tenantId && formData.party_size && formData.reservation_date && formData.reservation_time) {
      loadAvailableTables()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar fecha/hora/personas
  }, [formData.party_size, formData.reservation_date, formData.reservation_time])

  const loadTables = async () => {
    setLoadingTables(true)
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('number', { ascending: true })

      if (error) throw error
      setAvailableTables(data || [])
    } catch (err) {
      console.error('Error loading tables:', err)
    } finally {
      setLoadingTables(false)
    }
  }

  const loadAvailableTables = async () => {
    if (!formData.reservation_date || !formData.reservation_time) return

    setLoadingTables(true)
    try {
      // Obtener todas las mesas del tenant
      const { data: allTables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('capacity', formData.party_size)
        .order('number', { ascending: true })

      if (tablesError) throw tablesError

      // Obtener reservas existentes para la fecha/hora seleccionada
      const { data: existingReservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('table_id')
        .eq('tenant_id', tenantId)
        .eq('status', 'confirmed')
        .gte('reservation_date', formData.reservation_date)
        .lte('reservation_date', formData.reservation_date)

      if (reservationsError) throw reservationsError

      // Filtrar mesas ya reservadas
      const reservedTableIds = new Set(existingReservations?.map(r => r.table_id) || [])
      const available = (allTables || []).filter(table => !reservedTableIds.has(table.id))

      setAvailableTables(available)
    } catch (err) {
      console.error('Error loading available tables:', err)
      setAvailableTables([])
    } finally {
      setLoadingTables(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Validaciones
      if (!formData.customer_name || !formData.customer_phone || !formData.reservation_date || !formData.reservation_time) {
        throw new Error('Por favor completa todos los campos requeridos')
      }

      if (formData.party_size < 1 || formData.party_size > 20) {
        throw new Error('El número de personas debe estar entre 1 y 20')
      }

      // Validar que la fecha sea futura
      const reservationDateTime = new Date(`${formData.reservation_date}T${formData.reservation_time}`)
      const now = new Date()
      if (reservationDateTime < now) {
        throw new Error('La fecha y hora de la reserva debe ser en el futuro')
      }

      // Crear la reserva
      const { data, error: insertError } = await supabase
        .from('reservations')
        .insert({
          tenant_id: tenantId,
          customer_name: formData.customer_name.trim(),
          customer_phone: formData.customer_phone.trim(),
          customer_email: formData.customer_email.trim() || null,
          reservation_date: formData.reservation_date,
          reservation_time: formData.reservation_time,
          party_size: parseInt(formData.party_size),
          table_id: formData.table_id || null,
          special_requests: formData.special_requests.trim() || null,
          status: 'pending' // Cambiar a pending para que el admin confirme
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)

      // Limpiar formulario
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        reservation_date: '',
        reservation_time: '',
        party_size: 2,
        table_id: '',
        special_requests: ''
      })

      if (onSuccess) {
        onSuccess(data)
      }

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess(false)
      }, 5000)

    } catch (err) {
      console.error('Error creating reservation:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Obtener fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reserva tu mesa
        </h2>
        <p className="text-gray-600">
          {tenantName ? `Reserva en ${tenantName}` : 'Completa el formulario para hacer tu reserva'}
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-900">¡Reserva enviada!</h3>
            <p className="text-sm text-green-700 mt-1">
              Tu reserva ha sido enviada. Recibirás una confirmación pronto.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Juan Pérez"
            />
          </div>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (opcional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        {/* Fecha y Hora */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                name="reservation_date"
                value={formData.reservation_date}
                onChange={handleChange}
                min={today}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="time"
                name="reservation_time"
                value={formData.reservation_time}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Número de personas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de personas *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              name="party_size"
              value={formData.party_size}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} {i + 1 === 1 ? 'persona' : 'personas'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selección de mesa */}
        {formData.reservation_date && formData.reservation_time && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesa preferida (opcional)
            </label>
            <div className="relative">
              <Armchair className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                name="table_id"
                value={formData.table_id}
                onChange={handleChange}
                disabled={loadingTables}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Cualquier mesa disponible</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Mesa {table.number} - Capacidad: {table.capacity} personas
                  </option>
                ))}
              </select>
            </div>
            {loadingTables && (
              <p className="text-xs text-gray-500 mt-1">Cargando mesas disponibles...</p>
            )}
            {!loadingTables && availableTables.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ No hay mesas disponibles para la fecha y hora seleccionadas con capacidad para {formData.party_size} personas
              </p>
            )}
            {!loadingTables && availableTables.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {availableTables.length} mesa{availableTables.length !== 1 ? 's' : ''} disponible{availableTables.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Solicitudes especiales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Solicitudes especiales (opcional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              rows={3}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Alguna preferencia de mesa, alergias alimentarias, celebración especial..."
            />
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Calendar className="w-5 h-5" />
              <span>Confirmar Reserva</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          * Campos obligatorios
        </p>
      </form>
    </div>
  )
}

export default ReservationForm
