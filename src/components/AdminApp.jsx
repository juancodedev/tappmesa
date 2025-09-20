import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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
  ShoppingBag,
  Calendar,
  Tag
} from 'lucide-react'

// Importar componentes reales
import Dashboard from './admin/Dashboard'
import TablesManagerComponent from './admin/TablesManager'
import QRGenerator from './admin/QRGenerator'
import UsersManagerComponent from './admin/UsersManager'
import AnalyticsComponent from './admin/Analytics'
import StockManagerComponent from './admin/StockManager'
import SettingsComponent from './admin/Settings'
import OrdersManagerComponent from './admin/OrdersManager'
import ReservationsManager from './admin/ReservationsManager';
import CustomersManager from './admin/CustomersManager'
import CategoriesManager from './admin/CategoriesManager'
import ProductsManager from './admin/ProductsManager'
import TenantTester from './TenantTester'
import CompleteStockManager from './admin/CompleteStockManager'

// Importar supabase para obtener tenant ID
import { supabase } from '../lib/supabase'

const TablesManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Mesas</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
)

const QRGeneratorWrapper = () => {
  // Simular tenant ID - en producción esto vendría del contexto de autenticación
  const tenantId = 'cafe-central-tenant-id' // TODO: Obtener del contexto real
  
  return <QRGenerator tenantId={tenantId} />
}

const Analytics = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
)

const StockManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Stock</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
)

const UsersManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Usuarios</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
)

const SettingsManager = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuraciones</h1>
    <p className="text-gray-600">Funcionalidad en desarrollo...</p>
  </div>
)

const AdminApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, current: true },
    { name: 'Pedidos', href: '/admin/orders', icon: ShoppingBag, current: false },
    { name: 'Reservas', href: '/admin/reservations', icon: Calendar, current: false },
    { name: 'Mesas', href: '/admin/tables', icon: Coffee, current: false },
    { name: 'Códigos QR', href: '/admin/qr', icon: QrCode, current: false },
    { name: 'Usuarios', href: '/admin/users', icon: Users, current: false },
    { name: 'Estadísticas', href: '/admin/analytics', icon: BarChart3, current: false },
    { name: 'Stock', href: '/admin/stock', icon: Package, current: false },
    { name: 'Configuración', href: '/admin/settings', icon: Settings, current: false },
    { name: 'Multi-Tenant', href: '/admin/tenant-test', icon: Coffee, current: false },
    { name: 'Clientes', href: '/admin/customers', icon: Users, current: false },
    { name: 'Categorías', href: '/admin/categories', icon: Tag, current: false },
    { name: 'Productos', href: '/admin/products', icon: Package, current: false },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent navigation={navigation} closeSidebar={() => setSidebarOpen(false)} />
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
              <div className="text-sm text-gray-700">
                Admin User
              </div>
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
            <Route path="/orders" element={<OrdersManagerComponent />} />
            <Route path="/reservations" element={<ReservationsManager />} />
            <Route path="/tables" element={<TablesManagerComponent />} />
            <Route path="/qr" element={<QRGeneratorWrapper />} />
            <Route path="/users" element={<UsersManagerComponent />} />
            <Route path="/analytics" element={<AnalyticsComponent />} />
            {/* <Route path="/stock" element={<StockManagerComponent />} /> */}
            <Route path="/stock" element={<CompleteStockManager />} />
            <Route path="/settings" element={<SettingsComponent />} />
            <Route path="/tenant-test" element={<TenantTester />} />
            <Route path="/customers" element={<CustomersManager />} />
            <Route path="/categories" element={<CategoriesManager />} />
            <Route path="/products" element={<ProductsManager />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

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
        const Icon = item.icon
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.current
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </a>
        )
      })}
    </nav>

    {/* Footer */}
    <div className="px-4 py-6 border-t border-gray-200">
      <div className="text-xs text-gray-500 text-center">
        Tappmesa Admin v1.0
      </div>
    </div>
  </div>
)

export default AdminApp