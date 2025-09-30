import { useTenant } from '../../hooks/useTenant'
import ReservationForm from '../../components/reservations/ReservationForm'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar } from 'lucide-react'

const ReservationsPage = () => {
  const { tenant, loading } = useTenant()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reservas no disponibles
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo cargar la información del local
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información del local */}
          <div className="space-y-6">
            {/* Imagen o Logo */}
            {tenant.logo_url && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-full h-48 object-contain"
                />
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {tenant.name}
              </h1>

              {tenant.description && (
                <p className="text-gray-600 mb-6">
                  {tenant.description}
                </p>
              )}

              {/* Información de contacto */}
              <div className="space-y-3">
                {tenant.phone && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      📞
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{tenant.phone}</p>
                    </div>
                  </div>
                )}

                {tenant.email && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      📧
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{tenant.email}</p>
                    </div>
                  </div>
                )}

                {tenant.address && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      📍
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium">{tenant.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información importante */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                ℹ️ Información importante
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Las reservas están sujetas a disponibilidad</li>
                <li>• Recibirás una confirmación por teléfono</li>
                <li>• Por favor llega 10 minutos antes de tu reserva</li>
                <li>• Si llegas más de 15 minutos tarde, tu reserva puede ser cancelada</li>
              </ul>
            </div>
          </div>

          {/* Formulario de reserva */}
          <div>
            <ReservationForm
              tenantId={tenant.id}
              tenantName={tenant.name}
              onSuccess={(reservation) => {
                console.log('Reserva creada:', reservation)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReservationsPage
