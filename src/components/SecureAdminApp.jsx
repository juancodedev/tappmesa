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
  Shield,
  Circle,
  DollarSign,
  FileText
} from 'lucide-react'

import { useAuth } from '../hooks/useAuth'
import ProtectedRoute, { SuperAdminRoute, TenantAdminRoute } from './ProtectedRoute'

// Importar componentes
import Dashboard from './admin/Dashboard'
import TablesManagerComponent from './admin/TablesManager'
import TableStatusesManager from './admin/TableStatusesManager'
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
import SuperAdminTenantsManager from './admin/SuperAdminTenantsManager'
import SubscriptionPlansManager from './admin/SubscriptionPlansManager'
import TenantSubscriptionsManager from './admin/TenantSubscriptionsManager'
import PreBillSettings from './admin/PreBillSettings'
import SystemUsersManager from './admin/SystemUsersManager'
import SuperAdminOrdersManager from './admin/SuperAdminOrdersManager'
import SuperAdminProductsManager from './admin/SuperAdminProductsManager'
import SuperAdminTablesManager from './admin/SuperAdminTablesManager'
import SuperAdminReservationsManager from './admin/SuperAdminReservationsManager'
import SuperAdminCustomersManager from './admin/SuperAdminCustomersManager'
import SuperAdminCategoriesManager from './admin/SuperAdminCategoriesManager'
import SuperAdminStockManager from './admin/SuperAdminStockManager'

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
      name: 'Estados de Mesa',
      href: '/admin/table-statuses',
      icon: Circle,
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
      name: 'Pre-Cuentas',
      href: '/admin/prebill-settings',
      icon: FileText,
      requiredPermissions: []
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
      name: 'Planes de Suscripción',
      href: '/admin/subscription-plans',
      icon: Package,
      requiredPermissions: []
    },
    {
      name: 'Suscripciones',
      href: '/admin/tenant-subscriptions',
      icon: DollarSign,
      requiredPermissions: []
    },
    {
      name: 'Usuarios del Sistema',
      href: '/admin/system-users',
      icon: Shield,
      requiredPermissions: ['admin_users:read']
    },
    {
      name: 'Todos los Pedidos',
      href: '/admin/all-orders',
      icon: ShoppingBag,
      requiredPermissions: []
    },
    {
      name: 'Todos los Productos',
      href: '/admin/all-products',
      icon: Package,
      requiredPermissions: []
    },
    {
      name: 'Todas las Mesas',
      href: '/admin/all-tables',
      icon: Coffee,
      requiredPermissions: []
    },
    {
      name: 'Todas las Reservas',
      href: '/admin/all-reservations',
      icon: Calendar,
      requiredPermissions: []
    },
    {
      name: 'Todos los Clientes',
      href: '/admin/all-customers',
      icon: Users,
      requiredPermissions: []
    },
    {
      name: 'Todas las Categorías',
      href: '/admin/all-categories',
      icon: Tag,
      requiredPermissions: []
    },
    {
      name: 'Todo el Inventario',
      href: '/admin/all-stock',
      icon: Package,
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
    <div className="min-h-screen bg-linear-to-br from-amber-50 via-orange-50/30 to-amber-50">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-linear-to-b from-amber-900 to-amber-950 shadow-2xl">
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
        <div className="sticky top-0 z-40 flex h-16 bg-white/90 backdrop-blur-md shadow-md border-b border-amber-200/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex flex-1">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-amber-900">
                  Panel de Administración
                </h1>
                {user?.tenant && (
                  <span className="ml-3 text-sm text-amber-700 font-medium">
                    • {user.tenant.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-amber-900">
                <div className="font-semibold">{user?.full_name}</div>
                <div className="text-xs text-amber-700 capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-all"
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

            <Route path="/table-statuses" element={
              <TenantAdminRoute requirePermissions={['tables:read']}>
                <TableStatusesManager />
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

            <Route path="/prebill-settings" element={
              <TenantAdminRoute>
                <PreBillSettings />
              </TenantAdminRoute>
            } />

            {/* Rutas exclusivas para super admin */}
            <Route path="/tenants" element={
              <SuperAdminRoute>
                <SuperAdminTenantsManager />
              </SuperAdminRoute>
            } />

            <Route path="/subscription-plans" element={
              <SuperAdminRoute>
                <SubscriptionPlansManager />
              </SuperAdminRoute>
            } />

            <Route path="/tenant-subscriptions" element={
              <SuperAdminRoute>
                <TenantSubscriptionsManager />
              </SuperAdminRoute>
            } />

            <Route path="/tenant-test" element={
              <SuperAdminRoute>
                <TenantTester />
              </SuperAdminRoute>
            } />

            <Route path="/system-users" element={
              <SuperAdminRoute>
                <SystemUsersManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-orders" element={
              <SuperAdminRoute>
                <SuperAdminOrdersManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-products" element={
              <SuperAdminRoute>
                <SuperAdminProductsManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-tables" element={
              <SuperAdminRoute>
                <SuperAdminTablesManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-reservations" element={
              <SuperAdminRoute>
                <SuperAdminReservationsManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-customers" element={
              <SuperAdminRoute>
                <SuperAdminCustomersManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-categories" element={
              <SuperAdminRoute>
                <SuperAdminCategoriesManager />
              </SuperAdminRoute>
            } />

            <Route path="/all-stock" element={
              <SuperAdminRoute>
                <SuperAdminStockManager />
              </SuperAdminRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  )
}

const SidebarContent = ({ navigation, user, onLogout, closeSidebar, isNavigationActive }) => (
  <div className="flex flex-col h-full bg-linear-to-b from-amber-900 to-amber-950 shadow-2xl">
    {/* Logo */}
    <div className="flex items-center justify-between h-16 px-6 border-b border-amber-800/50">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
          <Coffee className="h-6 w-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold text-amber-50">Tappmesa</span>
          {user?.role === 'super_admin' && (
            <div className="text-xs text-amber-300 font-semibold">SUPER ADMIN</div>
          )}
        </div>
      </div>
      {closeSidebar && (
        <button onClick={closeSidebar} className="lg:hidden p-1 hover:bg-amber-800 rounded-lg transition-colors">
          <X className="h-6 w-6 text-amber-300" />
        </button>
      )}
    </div>

    {/* User info */}
    <div className="px-6 py-4 border-b border-amber-800/50 bg-amber-950/50">
      <div className="text-sm">
        <div className="font-semibold text-amber-50">{user?.full_name}</div>
        <div className="text-amber-300 text-xs">{user?.email}</div>
        {user?.tenant && (
          <div className="text-xs text-amber-400 mt-2 px-2 py-1 bg-amber-800/30 rounded inline-block">{user.tenant.name}</div>
        )}
      </div>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = isNavigationActive(item.href)
        return (
          <a
            key={item.name}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
              isActive
                ? 'bg-linear-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-900/50'
                : 'text-amber-100 hover:bg-amber-800/50 hover:text-white'
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
    <div className="px-4 py-6 border-t border-amber-800/50">
      <button
        onClick={onLogout}
        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-amber-100 rounded-xl hover:bg-amber-800/50 hover:text-white transition-all"
      >
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </button>

      <div className="text-xs text-amber-500 text-center mt-4">
        Tappmesa Admin v1.0
      </div>
    </div>
  </div>
)

export default SecureAdminApp