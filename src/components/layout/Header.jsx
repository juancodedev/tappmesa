import { useTenant } from "../../context/TenantContext";
import { Menu, Search } from "lucide-react";

const Header = ({ onMenuToggle, onSearchToggle }) => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 safe-area-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo y nombre del local */}
          <div className="flex items-center space-x-3">
            {tenant.logo_url ? (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: tenant.primary_color }}
              >
                {tenant.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{tenant.name}</h1>
              <p className="text-xs text-gray-500 capitalize">
                {tenant.business_type === "cafe"
                  ? "Cafetería"
                  : tenant.business_type === "teteria"
                  ? "Tetería"
                  : "Café & Té"}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onSearchToggle}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-target"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-target"
              aria-label="Menú"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
