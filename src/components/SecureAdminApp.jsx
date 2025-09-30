import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
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
  Tag,
  UserCheck,
  Shield
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import ProtectedRoute, { SuperAdminRoute, TenantAdminRoute } from './ProtectedRoute'

// Importar componentes
import Dashboard from './admin/Dashboard'
import TablesManagerComponent from './admin/TablesManager'
import QRGenerator from './admin/QRGenerator'
import UsersManagerComponent from './admin/UsersManager'
import AnalyticsComponent from './admin/Analytics'
import StockManagerComponent from './admin/StockManager'
import SettingsComponent from './admin/Settings'
import OrdersManagerComponent from './admin/OrdersManager'
import ReservationsManager from './admin/ReservationsManager'
import CustomersManager from './admin/CustomersManager'
import CategoriesManager from './admin/CategoriesManager'
import ProductsManager from './admin/ProductsManager'
import TenantTester from './TenantTester'

const SecureAdminApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isSuperAdmin, hasPermission } = useAuth()
  const location = useLocation()

  // Navegación base para todos los usuarios autenticados
  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      requiredPermissions: []
    }
  ]

  // Navegación para tenant admins y staff
  const tenantNavigation = [
    {
      name: 'Pedidos',
      href: '/admin/orders',
      icon: ShoppingBag,
      requiredPermissions: ['orders:read']
    },
    {
      name: 'Reservas',
      href: '/admin/reservations',
      icon: Calendar,
      requiredPermissions: ['reservations:read']
    },
    {
      name: 'Clientes',
      href: '/admin/customers',
      icon: UserCheck,
      requiredPermissions: ['customers:read']
    },
    {
      name: 'Usuarios',
      href: '/admin/users',
      icon: Users,
      requiredPermissions: ['users:read']
    },
    {
      name: 'Categorías',
      href: '/admin/categories',
      icon: Tag,
      requiredPermissions: ['categories:read']
    },
    {
      name: 'Productos',
      href: '/admin/products',
      icon: Package,
      requiredPermissions: ['products:read']
    },
    {
      name: 'Stock',
      href: '/admin/stock',
      icon: Package,
      requiredPermissions: ['stock:read']
    },
    {
      name: 'Mesas',
      href: '/admin/tables',
      icon: Coffee,
      requiredPermissions: ['tables:read']
    },
    {
      name: 'Códigos QR',
      href: '/admin/qr',
      icon: QrCode,
      requiredPermissions: ['qr:read']
    },
    {
      name: 'Estadísticas',
      href: '/admin/analytics',
      icon: BarChart3,
      requiredPermissions: ['analytics:read']
    },
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Settings,
      requiredPermissions: []
    }
  ]

  // Navegación exclusiva para super admins
  const superAdminNavigation = [
    {
      name: 'Gestión de Tenants',
      href: '/admin/tenants',
      icon: Coffee,
      requiredPermissions: ['tenants:read']
    },
    {
      name: 'Usuarios del Sistema',
      href: '/admin/system-users',
      icon: Shield,
      requiredPermissions: ['admin_users:read']
    },
    {
      name: 'Multi-Tenant Test',
      href: '/admin/tenant-test',
      icon: Coffee,
      requiredPermissions: []
    }
  ]

  // Construir navegación según permisos del usuario
  const getNavigation = () => {
    let navigation = [...baseNavigation]

    // Agregar navegación de tenant
    const allowedTenantNav = tenantNavigation.filter(item => {
      if (item.requiredPermissions.length === 0) return true
      return item.requiredPermissions.some(permission => {
        const [resource, action] = permission.split(':')
        return hasPermission(resource, action)
      })
    })
    navigation = [...navigation, ...allowedTenantNav]

    // Agregar navegación de super admin
    if (isSuperAdmin) {
      navigation = [...navigation, ...superAdminNavigation]
    }

    return navigation
  }

  const navigation = getNavigation()

  // Función para determinar si una opción está activa
  const isNavigationActive = (href) => {
    if (href === '/admin' && location.pathname === '/admin') {
      return true
    }
    if (href !== '/admin' && location.pathname.startsWith(href)) {
      return true
    }
    return false
  }

  const handleLogout = async () => {
    await logout()
    // Redirigir será manejado por ProtectedRoute
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <SidebarContent
              navigation={navigation}
              user={user}
              onLogout={handleLogout}
              closeSidebar={() => setSidebarOpen(false)}
              isNavigationActive={isNavigationActive}
            />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent
          navigation={navigation}
          user={user}
          onLogout={handleLogout}
          isNavigationActive={isNavigationActive}
        />
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
                {user?.tenant && (
                  <span className="ml-3 text-sm text-gray-500">
                    • {user.tenant.name}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <div className="font-medium">{user?.full_name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content con protección por rutas */}
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/orders" element={
              <TenantAdminRoute requirePermissions={['orders:read']}>
                <OrdersManagerComponent />
              </TenantAdminRoute>
            } />
            
            <Route path="/reservations" element={
              <TenantAdminRoute requirePermissions={['reservations:read']}>
                <ReservationsManager />
              </TenantAdminRoute>
            } />
            
            <Route path="/customers" element={
              <TenantAdminRoute requirePermissions={['customers:read']}>
                <CustomersManager />
              </TenantAdminRoute>
            } />

            <Route path="/users" element={
              <TenantAdminRoute requirePermissions={['users:read']}>
                <UsersManagerComponent />
              </TenantAdminRoute>
            } />

            <Route path="/categories" element={
              <TenantAdminRoute requirePermissions={['categories:read']}>
                <CategoriesManager />
              </TenantAdminRoute>
            } />
            
            <Route path="/products" element={
              <TenantAdminRoute requirePermissions={['products:read']}>
                <ProductsManager />
              </TenantAdminRoute>
            } />
            
            <Route path="/stock" element={
              <TenantAdminRoute requirePermissions={['stock:read']}>
                <StockManagerComponent />
              </TenantAdminRoute>
            } />
            
            <Route path="/tables" element={
              <TenantAdminRoute requirePermissions={['tables:read']}>
                <TablesManagerComponent />
              </TenantAdminRoute>
            } />
            
            <Route path="/qr" element={
              <TenantAdminRoute requirePermissions={['qr:read']}>
                <QRGenerator tenantId={user?.tenant_id} />
              </TenantAdminRoute>
            } />
            
            <Route path="/analytics" element={
              <TenantAdminRoute requirePermissions={['analytics:read']}>
                <AnalyticsComponent />
              </TenantAdminRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsComponent />
              </ProtectedRoute>
            } />

            {/* Rutas exclusivas para super admin */}
            <Route path="/tenant-test" element={
              <SuperAdminRoute>
                <TenantTester />
              </SuperAdminRoute>
            } />
            
            <Route path="/system-users" element={
              <SuperAdminRoute>
                <UsersManagerComponent />
              </SuperAdminRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

const SidebarContent = ({ navigation, user, onLogout, closeSidebar, isNavigationActive }) => (
  <div className="flex flex-col h-full bg-white">
    {/* Logo */}
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <div>
          <span className="text-xl font-bold text-gray-900">Tappmesa</span>
          {user?.role === 'super_admin' && (
            <div className="text-xs text-primary font-medium">SUPER ADMIN</div>
          )}
        </div>
      </div>
      {closeSidebar && (
        <button onClick={closeSidebar} className="lg:hidden">
          <X className="h-6 w-6 text-gray-400" />
        </button>
      )}
    </div>

    {/* User info */}
    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div className="text-sm">
        <div className="font-medium text-gray-900">{user?.full_name}</div>
        <div className="text-gray-500">{user?.email}</div>
        {user?.tenant && (
          <div className="text-xs text-gray-400 mt-1">{user.tenant.name}</div>
        )}
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = isNavigationActive(item.href)
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={closeSidebar ? () => closeSidebar() : undefined}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </a>
        )
      })}
    </nav>

    {/* Footer */}
    <div className="px-4 py-6 border-t border-gray-200">
      <button
        onClick={onLogout}
        className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </button>
      
      <div className="text-xs text-gray-500 text-center mt-4">
        Tappmesa Admin v1.0
      </div>
    </div>
  </div>
)

export default SecureAdminApp