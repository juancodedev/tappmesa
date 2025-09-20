import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Users, MapPin, Phone } from "lucide-react";
import { useTenant } from "../context/TenantContext";
import ReservationForm from "./ReservationForm";

const ReservationsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Restaurante no encontrado
          </h2>
          <p className="text-gray-600 mb-4">
            No pudimos encontrar el restaurante que buscas.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </button>

              <div className="hidden sm:block h-6 w-px bg-gray-300" />

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {tenant.name}
                  </h1>
                  <p className="text-sm text-gray-500">Reserva tu mesa</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <a
                href={`/${slug}/menu`}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Ver Menú
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-red-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Reserva tu Mesa
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Asegura tu lugar en {tenant.name} y disfruta de una experiencia
            única
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto text-center">
            <div className="flex flex-col items-center">
              <Clock className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Reserva Rápida</h3>
              <p className="text-sm opacity-75">En menos de 2 minutos</p>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Grupos Grandes</h3>
              <p className="text-sm opacity-75">Hasta 20 personas</p>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="w-8 h-8 mb-2" />
              <h3 className="font-semibold">Mesa Asegurada</h3>
              <p className="text-sm opacity-75">Tu lugar garantizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Reserva */}
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ReservationForm />
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Contacto
              </h3>
              <div className="space-y-3">
                {tenant.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{tenant.phone}</span>
                  </div>
                )}
                {tenant.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{tenant.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Política de Reservas
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Las reservas se confirman automáticamente</p>
                <p>• Puedes cancelar hasta 2 horas antes</p>
                <p>
                  • Para grupos de más de 8 personas, contactar directamente
                </p>
                <p>• Mesa disponible por 2 horas desde la hora reservada</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action adicional */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-semibold mb-2">
            ¿Prefieres ordenar para llevar?
          </h3>
          <p className="text-gray-300 mb-4">
            Explora nuestro menú y haz tu pedido directamente desde tu mesa
          </p>
          <a
            href={`/${slug}/menu`}
            className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            <span>Ver Menú Completo</span>
            <ArrowLeft className="w-4 h-4 rotate-180" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ReservationsPage;
