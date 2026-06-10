import React from "react";
import { Analytics } from "@vercel/analytics/react"
import { Routes, Route } from "react-router-dom";
import { TenantProvider } from "./context/TenantContext";
import { useTenant } from "./hooks/useTenant";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy-loaded components for better code splitting
import {
  AdminApp,
  SecureAdminApp,
  TableApp,
  LoginPage,
  LandingPage,
  RegisterPage,
  MenuLayout,
  PrivacyPage,
  TermsPage,
  HelpPage,
  ContactPage,
  ReservationsPage,
  WaiterDashboard,
  KitchenDashboard,
  ContactSales
} from './components/LazyComponents';

// Keep ProtectedRoute as regular import since it's lightweight
import ProtectedRoute from './components/ProtectedRoute';

// Componente para debugging
const SubdomainDebug = () => {
  const { tenant, error, subdomain, appType } = useTenant();

  return (
    <div className="fixed top-4 right-4 bg-black/75 text-white p-3 rounded-lg text-xs z-50">
      <div>🌐 Host: {window.location.hostname}</div>
      <div>📍 Subdomain: {subdomain || "none"}</div>
      <div>🎯 App Type: {appType}</div>
      <div>🏪 Tenant: {tenant?.name || "none"}</div>
      {error && <div className="text-red-300">❌ {error}</div>}
    </div>
  );
};

// Admin App Component (sin cambios)
const AdminAppWrapper = () => (
  <div className="min-h-screen bg-gray-100">
    <AdminApp />
  </div>
);

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
      return <LandingPage />;
  }
};


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Nuevas rutas de de autenticación y registro */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

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

            {/* Ruta para el dashboard de cocina */}
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/cocina" element={<KitchenDashboard />} />

            {/* Ruta específica para reservas */}
            <Route path="/reservas" element={<ReservationsPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />

            {/* Ruta para mesas específicas (existente) */}
            <Route path="/:slug/:table" element={<TableApp />} />

            {/* Ruta de inicio exacta - ahora con landing mejorada */}
            <Route path="/" element={<LandingPage />} />

            {/* Ruta catch-all al final (existente) */}
            <Route path="/*" element={<AppContent />} />
            <Route path="/contact-sales" element={<ContactSales/>} />
          </Routes>
          {import.meta.env.DEV && <SubdomainDebug />}
        </TenantProvider>
        <Analytics />
      </AuthProvider>
    </ErrorBoundary>
  );
}
export default App;
