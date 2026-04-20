/* eslint-disable react-refresh/only-export-components -- archivo de lazy loading que exporta HOC y componentes */
import { lazy, Suspense } from 'react';

// Loading component for better UX during chunk loading
const LoadingSpinner = ({ message = "Cargando..." }) => (
  <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Lazy load major components
const LazyAdminApp = lazy(() => import('./AdminApp'));
const LazySecureAdminApp = lazy(() => import('./SecureAdminApp'));
const LazyTableApp = lazy(() => import('./TableApp'));

// Lazy load page components
const LazyLandingPage = lazy(() => import('../pages/landing/LandingPage'));
const LazyRegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const LazyLoginPage = lazy(() => import('../pages/auth/LoginPage'));
const LazyReservationsPage = lazy(() => import('../pages/reservations/ReservationsPage'));

// Lazy load Legal/Landing pages
const LazyPrivacyPage = lazy(() => import('../pages/landing/PrivacyPage'));
const LazyTermsPage = lazy(() => import('../pages/landing/TermsPage'));
const LazyHelpPage = lazy(() => import('../pages/landing/HelpPage'));
const LazyContactPage = lazy(() => import('../pages/landing/ContactPage'));

// Lazy load layout components
const LazyMenuLayout = lazy(() => import('./layout/MenuLayout'));

// HOC to wrap components with Suspense and custom loading
const withSuspense = (Component, loadingMessage) => {
  return function SuspenseWrapper(props) {
    return (
      <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
        <Component {...props} />
      </Suspense>
    );
  };
};

// Export wrapped components
export const AdminApp = withSuspense(LazyAdminApp, "Cargando panel de administración...");
export const SecureAdminApp = withSuspense(LazySecureAdminApp, "Cargando administrador seguro...");
export const TableApp = withSuspense(LazyTableApp, "Cargando mesa...");

export const LandingPage = withSuspense(LazyLandingPage, "Cargando página principal...");
export const RegisterPage = withSuspense(LazyRegisterPage, "Cargando registro...");
export const LoginPage = withSuspense(LazyLoginPage, "Cargando inicio de sesión...");
export const ReservationsPage = withSuspense(LazyReservationsPage, "Cargando reservas...");

export const PrivacyPage = withSuspense(LazyPrivacyPage, "Cargando política de privacidad...");
export const TermsPage = withSuspense(LazyTermsPage, "Cargando términos de servicio...");
export const HelpPage = withSuspense(LazyHelpPage, "Cargando ayuda...");
export const ContactPage = withSuspense(LazyContactPage, "Cargando contacto...");

export const MenuLayout = withSuspense(LazyMenuLayout, "Cargando menú...");

// Also export the LoadingSpinner for direct use
export { LoadingSpinner };
