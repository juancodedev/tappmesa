import { useTenant } from '../hooks/useTenant';
import { useTenantUrl } from "../hooks/useTenantHooks";
import { CartProvider } from "../context/CartContext";
import MenuLayout from "./layout/MenuLayout";

const TableApp = () => {
  const { tenant, table, tableSession, loading } = useTenant();
  const tenantUrl = useTenantUrl();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando con la mesa...</p>
        </div>
      </div>
    );
  }

  if (!tenant || !table) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Mesa no encontrada
          </h1>
          <p className="text-gray-600 mb-4">
            El código de mesa no es válido o la mesa no está disponible.
          </p>
          <button
            onClick={() =>
              (window.location.href = tenantUrl || "/")
            }
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al menú principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header específico de mesa */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tenant.name}
              </h1>
              <p className="text-sm text-gray-600">
                {table.number} • {table.location}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Sesión</p>
              <p className="text-sm font-mono text-gray-700">
                {tableSession?.session_code || "Cargando..."}
              </p>
            </div>
          </div>
        </div>

        {/* Menú normal pero con padding top para el header fijo */}
        <div style={{ paddingTop: "0px" }}>
          <MenuLayout />
        </div>

        {/* Información de la mesa fija en la parte inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30 safe-area-bottom">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-gray-600">Mesa:</span>
              <span className="font-semibold text-gray-900">
                {table.number}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">Capacidad:</span>
              <span className="font-semibold text-gray-900">
                {table.capacity} personas
              </span>
            </div>
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                table.status === "available"
                  ? "bg-green-100 text-green-800"
                  : table.status === "occupied"
                  ? "bg-yellow-100 text-yellow-800"
                  : table.status === "reserved"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {table.status === "available"
                ? "Disponible"
                : table.status === "occupied"
                ? "Ocupada"
                : table.status === "reserved"
                ? "Reservada"
                : "Mantenimiento"}
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
};

export default TableApp;
