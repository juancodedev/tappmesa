import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Text contrast (odd/tasks/text-contrast.md): on light surfaces text-gray-400
// is 2.54:1 on white, below WCAG AA (4.5:1). Migrated screens use gray-500
// (4.83:1) or gray-600. Dark surfaces keep gray-400 (6.99:1 on gray-900).

const MIGRATED = {
  'T1 customer and staff': [
    'components/menu/MenuGrid.jsx',
    'features/cart/components/CartItem.jsx',
    'components/table/TableOrdersHistory.jsx',
    'components/TableApp.jsx',
    'components/reservations/ReservationForm.jsx',
    'pages/reservations/ReservationsPage.jsx',
    'pages/auth/LoginPage.jsx',
    'pages/auth/RegisterPage.jsx',
    'pages/contact-sales/ContactSales.jsx',
    'pages/waiter/WaiterDashboard.jsx',
    'pages/waiter/components/CreateOrderModal.jsx',
    'pages/waiter/components/ActiveOrdersPanel.jsx',
    'pages/kitchen/KitchenDashboard.jsx',
  ],
  'T2 tenant admin': [
    'components/admin/ReservationsManager.jsx',
    'components/admin/UsersManager.jsx',
    'components/admin/CustomersManager.jsx',
    'components/admin/StockManager.jsx',
    'components/admin/CompleteStockManager.jsx',
    'components/admin/ProductsManager.jsx',
    'components/admin/CategoriesManager.jsx',
    'components/admin/TableStatusesManager.jsx',
    'components/admin/QRGenerator.jsx',
    'components/admin/TenantSubscriptionsManager.jsx',
    'components/admin/TablesManager.jsx',
    'components/admin/PreBillSettings.jsx',
    'components/admin/OrdersManager.jsx',
    'components/AdminApp.jsx',
  ],
}

const read = (file) => readFileSync(path.resolve(process.cwd(), 'src', file), 'utf8')

describe.each(Object.entries(MIGRATED))('%s', (_group, files) => {
  it.each(files)('%s has no low-contrast gray-400 text', (file) => {
    const lines = read(file).split('\n')
      .map((line, i) => `${i + 1}: ${line.trim()}`)
      .filter((line) => /\btext-gray-400\b/.test(line))
    expect(lines).toEqual([])
  })
})
