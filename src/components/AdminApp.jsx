import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import {
  LayoutDashboard,
  Coffee,
  Users,
  QrCode,
  BarChart3,
  Package,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import QRGenerator from "./admin/QRGenerator";

// Componentes del dashboard (por crear)
const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">Ventas Hoy</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">$127.500</p>
        <p className="text-sm text-green-600 mt-1">+12% vs ayer</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">Órdenes Activas</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">8</p>
        <p className="text-sm text-blue-600 mt-1">3 preparando</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">Mesas Ocupadas</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">6/12</p>
        <p className="text-sm text-yellow-600 mt-1">50% ocupación</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">
          Productos Bajo Stock
        </h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">3</p>
        <p className="text-sm text-red-600 mt-1">Requiere atención</p>
      </div>
    </div>
  </div>
);

const TablesManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Mesas</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
);

const QRGeneratorWrapper = () => {
  // Simular tenant ID - en producción esto vendría del contexto de autenticación
  const tenantId = "cafe-central-tenant-id"; // TODO: Obtener del contexto real

  return <QRGenerator tenantId={tenantId} />;
};

const Analytics = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
);

const StockManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Stock</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
);

const UsersManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">
      Gestión de Usuarios
    </h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
);

const SettingsManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuraciones</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
);

const AdminApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, current: true },
    { name: "Mesas", href: "/admin/tables", icon: Coffee, current: false },
    { name: "Códigos QR", href: "/admin/qr", icon: QrCode, current: false },
    { name: "Usuarios", href: "/admin/users", icon: Users, current: false },
    {
      name: "Estadísticas",
      href: "/admin/analytics",
      icon: BarChart3,
      current: false,
    },
    { name: "Stock", href: "/admin/stock", icon: Package, current: false },
    {
      name: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      current: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent
              navigation={navigation}
              closeSidebar={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent navigation={navigation} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex flex-1">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Panel de Administración
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">Admin User</div>
              <button className="text-gray-400 hover:text-gray-500">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tables" element={<TablesManager />} />
            <Route path="/qr" element={<QRGeneratorWrapper />} />
            <Route path="/users" element={<UsersManager />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/stock" element={<StockManager />} />
            <Route path="/settings" element={<SettingsManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation, closeSidebar }) => (
  <div className="flex flex-col h-full bg-white">
    {/* Logo */}
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="text-xl font-bold text-gray-900">Tappmesa</span>
      </div>
      {closeSidebar && (
        <button onClick={closeSidebar} className="lg:hidden">
          <X className="h-6 w-6 text-gray-400" />
        </button>
      )}
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.current
                ? "bg-primary text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </a>
        );
      })}
    </nav>

    {/* Footer */}
    <div className="px-4 py-6 border-t border-gray-200">
      <div className="text-xs text-gray-500 text-center">
        Tappmesa Admin v1.0
      </div>
    </div>
  </div>
);

export default AdminApp;
