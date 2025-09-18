import { TenantProvider, useTenant } from './context/TenantContext'
import MenuLayout from './components/layout/MenuLayout'

// Componente para debugging
const SubdomainDebug = () => {
  const { tenant, loading, error, subdomain, appType } = useTenant()

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
      <div>🌐 Host: {window.location.hostname}</div>
      <div>📍 Subdomain: {subdomain || 'none'}</div>
      <div>🎯 App Type: {appType}</div>
      <div>🏪 Tenant: {tenant?.name || 'none'}</div>
      {error && <div className="text-red-300">❌ {error}</div>}
    </div>
  )
}

// Landing Page Component
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
    <div className="text-center px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        🍽️ Tappmesa
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        La forma más fácil de gestionar tu cafetería o tetería
      </p>
      
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="space-y-4">
          <button className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors touch-target">
            Crear mi local
          </button>
          <button className="w-full border-2 border-primary text-primary py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors touch-target">
            Ver demo
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-gray-500 space-y-1">
        <p>💡 Prueba con subdominios:</p>
        <p><code>cafe-central.tappmesa.local:5173</code></p>
        <p><code>admin.tappmesa.local:5173</code></p>
      </div>
    </div>
  </div>
)

// Admin App Component
const AdminApp = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        🔧 Admin Panel
      </h1>
      <p className="text-gray-600 mb-8">
        Panel de administración de Tappmesa
      </p>
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Iniciar Sesión
        </button>
      </div>
    </div>
  </div>
)

// Tenant App Component
const TenantApp = () => {
  const { tenant, loading } = useTenant()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cafetería...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">☕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Cafetería no encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            La cafetería que buscas no existe o no está disponible.
          </p>
          <a 
            href="http://tappmesa.local:5173"
            className="inline-block bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return <MenuLayout />
}

// Error Boundary Component
const TenantError = ({ error }) => (
  <div className="min-h-screen bg-red-50 flex items-center justify-center">
    <div className="text-center px-4">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-red-900 mb-2">
        Error de conexión
      </h1>
      <p className="text-red-600 mb-4">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
)

// Main App Router
const AppContent = () => {
  const { appType, error } = useTenant()

  if (error) {
    return <TenantError error={error} />
  }

  switch (appType) {
    case 'admin':
      return <AdminApp />
    case 'tenant':
      return <TenantApp />
    case 'landing':
    default:
      return <LandingPage />
  }
}

function App() {
  return (
    <TenantProvider>
      <AppContent />
      {/* Debug info - remover en producción */}
      {import.meta.env.DEV && <SubdomainDebug />}
    </TenantProvider>
  )
}

export default App