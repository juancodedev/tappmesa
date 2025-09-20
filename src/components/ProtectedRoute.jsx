import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({
  children,
  requirePermissions = [],
  requireRole = null,
  allowSuperAdmin = true,
}) => {
  const { user, loading, hasPermission, isSuperAdmin } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Super admin tiene acceso a todo (si está permitido)
  if (allowSuperAdmin && isSuperAdmin) {
    return children;
  }

  // Verificar rol específico requerido
  if (requireRole && user.role !== requireRole) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Rol requerido: {requireRole} | Tu rol: {user.role}
          </p>
        </div>
      </div>
    );
  }

  // Verificar permisos específicos
  if (requirePermissions.length > 0) {
    const hasRequiredPermissions = requirePermissions.every((permission) => {
      const [resource, action] = permission.split(":");
      return hasPermission(resource, action);
    });

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Permisos Insuficientes
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes los permisos necesarios para acceder a esta
              funcionalidad.
            </p>
            <div className="text-sm text-gray-500">
              <p>Permisos requeridos:</p>
              <ul className="list-disc list-inside mt-2">
                {requirePermissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      );
    }
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return children;
};

// Componente específico para rutas de super admin
export const SuperAdminRoute = ({ children }) => {
  return (
    <ProtectedRoute requireRole="super_admin" allowSuperAdmin={true}>
      {children}
    </ProtectedRoute>
  );
};

// Componente específico para rutas de tenant admin
export const TenantAdminRoute = ({ children, requirePermissions = [] }) => {
  return (
    <ProtectedRoute
      requirePermissions={requirePermissions}
      allowSuperAdmin={true}
    >
      {children}
    </ProtectedRoute>
  );
};

// HOC para proteger componentes con permisos específicos
export const withPermissions = (WrappedComponent, permissions = []) => {
  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute requirePermissions={permissions}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

export default ProtectedRoute;
