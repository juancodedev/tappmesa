import React from "react";
import { Analytics } from "@vercel/analytics/react"
import { Routes, Route } from "react-router-dom";
import { TenantProvider } from "./context/TenantContext";
import { useTenant } from "./hooks/useTenant";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from './context/AuthContext';

// Lazy-loaded components for better code splitting
import {
  AdminApp,
  SecureAdminApp,
  TableApp,
  LoginPage,
  LandingPage,
  RegisterPage,
  BusinessLoginPage,
  MenuLayout
} from './components/LazyComponents';

// Importar directamente (no lazy) para reservas y waiter
import ReservationsPage from './pages/reservations/ReservationsPage';
import WaiterDashboard from './pages/waiter/WaiterDashboard';

// Keep ProtectedRoute as regular import since it's lightweight
import ProtectedRoute from './components/ProtectedRoute';

// Componente para debugging
const SubdomainDebug = () => {
  const { tenant, loading, error, subdomain, appType } = useTenant();

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs z-50">
      <div>🌐 Host: {window.location.hostname}</div>
      <div>📍 Subdomain: {subdomain || "none"}</div>
      <div>🎯 App Type: {appType}</div>
      <div>🏪 Tenant: {tenant?.name || "none"}</div>
      {error && <div className="text-red-300">❌ {error}</div>}
    </div>
  );
};

// Nueva Landing Page mejorada
const EnhancedLandingPage = () => {
  const { appType } = useTenant();

  console.log('🏠 EnhancedLandingPage - appType:', appType, 'hostname:', window.location.hostname);

  // Siempre mostrar la nueva landing cuando appType es 'landing'
  // Esto incluye localhost, tappmesa.local, y dominios principales
  return <LandingPage />;
};

// Admin App Component (sin cambios)
const AdminAppWrapper = () => (
  <div className="min-h-screen bg-gray-100">
    <AdminApp />
  </div>
);

// Tenant App Component (sin cambios)
const TenantApp = () => {
  const { tenant, loading } = useTenant();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cafetería...</p>
        </div>
      </div>
    );
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
    );
  }

  return (
    <CartProvider>
      <MenuLayout />
    </CartProvider>
  );
};

// Error Boundary Component (sin cambios)
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
);

// Main App Router actualizado
const AppContent = () => {
  const { appType, error } = useTenant();

  if (error) {
    return <TenantError error={error} />;
  }

  switch (appType) {
    case "admin":
      return <AdminAppWrapper />;
    case "table":
      return <TableApp />;
    case "tenant":
      return (
        <CartProvider>
          <MenuLayout />
        </CartProvider>
      );
    case "landing":
    default:
      return <EnhancedLandingPage />;
  }
};

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <Routes>
          {/* Nuevas rutas de autenticación y registro */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<BusinessLoginPage />} />
          
          {/* Rutas de páginas legales/informativas */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Ruta de login para admin (existente) */}
          <Route path="/admin/login" element={<LoginPage />} />
          
          {/* Rutas más específicas primero (existentes) */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <SecureAdminApp />
            </ProtectedRoute>
          } />

          {/* Ruta para el dashboard del garzón */}
          <Route path="/waiter" element={<WaiterDashboard />} />
          <Route path="/garzon" element={<WaiterDashboard />} />

          {/* Ruta específica para reservas */}
          <Route path="/reservas" element={<ReservationsPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />

          {/* Ruta para mesas específicas (existente) */}
          <Route path="/:slug/:table" element={<TableApp />} />

          {/* Ruta de inicio exacta - ahora con landing mejorada */}
          <Route path="/" element={<EnhancedLandingPage />} />

          {/* Ruta catch-all al final (existente) */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
        {import.meta.env.DEV && <SubdomainDebug />}
      </TenantProvider>
      <Analytics />
    </AuthProvider>
  );
}

// Componentes de páginas simples para las rutas legales
const PrivacyPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">
            En TappMesa, valoramos y respetamos tu privacidad. Esta política describe 
            cómo recopilamos, usamos y protegemos tu información personal.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Información que Recopilamos</h2>
          <p className="text-gray-600 mb-4">
            Recopilamos información que nos proporcionas directamente, como cuando 
            creas una cuenta o contactas nuestro soporte.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Uso de la Información</h2>
          <p className="text-gray-600 mb-4">
            Utilizamos tu información para proporcionarte nuestros servicios, 
            mejorar la experiencia del usuario y comunicarnos contigo.
          </p>
          {/* Más contenido de política de privacidad */}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-primary hover:text-primary-dark">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  </div>
);

const TermsPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos de Servicio</h1>
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">
            Bienvenido a TappMesa. Estos términos de servicio describen las reglas 
            y regulaciones para el uso de nuestros servicios.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Aceptación de Términos</h2>
          <p className="text-gray-600 mb-4">
            Al acceder y usar TappMesa, aceptas estar sujeto a estos términos de servicio.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Uso del Servicio</h2>
          <p className="text-gray-600 mb-4">
            Puedes usar nuestro servicio para gestionar tu restaurante de acuerdo 
            con estos términos y todas las leyes aplicables.
          </p>
          {/* Más contenido de términos */}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-primary hover:text-primary-dark">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  </div>
);

const HelpPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Centro de Ayuda</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">¿Cómo empiezo a usar TappMesa?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Simplemente regístrate, configura tu restaurante y comenzarás 
                  a recibir órdenes digitales.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">¿Necesito hardware especial?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  No, TappMesa funciona en cualquier dispositivo con internet.
                </p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span>📧</span>
                <span className="text-gray-600">soporte@tappmesa.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span>📞</span>
                <span className="text-gray-600">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <span>🕐</span>
                <span className="text-gray-600">Lun-Vie 9:00-18:00</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-primary hover:text-primary-dark">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contacto</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">¿Tienes alguna pregunta?</h2>
          <p className="text-gray-600 mb-6">
            Estamos aquí para ayudarte. Contacta con nuestro equipo y te responderemos 
            lo antes posible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-medium text-gray-900">Email</h3>
              <p className="text-gray-600">soporte@tappmesa.com</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📞</div>
              <h3 className="font-medium text-gray-900">Teléfono</h3>
              <p className="text-gray-600">+56 9 1234 5678</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/" className="text-primary hover:text-primary-dark">
            ← Volver al inicio
          </a>
        </div>
      </div>
    </div>
  </div>
);

export default App;