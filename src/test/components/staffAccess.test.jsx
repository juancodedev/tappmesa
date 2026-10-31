import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Staff views (2026-10-31): the panel and /api/admin/users create the roles
// `waiter` and `kitchen`, but the routes required `staff` and `cocina`, so
// every staff user saw "Acceso Denegado". The kitchen also embedded
// `tables` from `orders`, which has no foreign key to it (PGRST200).

let auth
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => auth }))

const selects = []
const kitchenOrders = [
  { id: 'o1', order_number: 'A-1', status: 'pending', table_number: '5', created_at: new Date().toISOString(), total: 1000, order_items: [] },
]
const chain = () => {
  const q = {}
  for (const m of ['eq', 'order', 'in', 'update']) q[m] = () => q
  q.select = (s) => { selects.push(s); return q }
  q.then = (resolve, reject) => Promise.resolve({ data: kitchenOrders, error: null }).then(resolve, reject)
  return q
}
vi.mock('../../lib/supabase', () => ({ supabase: { from: () => chain() } }))
vi.mock('../../hooks/useTenant', () => ({ useTenant: () => ({ tenant: { id: 't1', name: 'Bistro' }, loading: false }) }))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }))

import ProtectedRoute from '../../components/ProtectedRoute'
import KitchenDashboard from '../../pages/kitchen/KitchenDashboard'
import { WAITER_ROLES, KITCHEN_ROLES, hasStaffPermission } from '../../utils/staffRoles'

const asRole = (role) => {
  auth = { user: { id: 'u1', tenant_id: 't1', role, full_name: 'Chef' }, loading: false, isSuperAdmin: false, hasPermission: () => false, logout: vi.fn() }
}
const guarded = (roles) => render(
  <MemoryRouter>
    <ProtectedRoute requireRole={roles}><p>Vista del personal</p></ProtectedRoute>
  </MemoryRouter>
)

describe('staff route roles', () => {
  it.each([
    ['kitchen', KITCHEN_ROLES],
    ['cocina', KITCHEN_ROLES],
    ['waiter', WAITER_ROLES],
    ['staff', WAITER_ROLES],
  ])('lets %s into its view', (role, roles) => {
    asRole(role)
    guarded(roles)
    expect(screen.getByText('Vista del personal')).toBeInTheDocument()
  })

  it.each([
    ['tenant_admin', KITCHEN_ROLES],
    ['waiter', KITCHEN_ROLES],
    ['kitchen', WAITER_ROLES],
  ])('keeps %s out of the other view', (role, roles) => {
    asRole(role)
    guarded(roles)
    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument()
    expect(screen.queryByText('Vista del personal')).not.toBeInTheDocument()
  })

  it('still accepts a single role string', () => {
    asRole('kitchen')
    guarded('kitchen')
    expect(screen.getByText('Vista del personal')).toBeInTheDocument()
  })
})

describe('staff permissions', () => {
  it('gives the kitchen orders and tables, nothing else', () => {
    for (const role of KITCHEN_ROLES) {
      expect(hasStaffPermission(role, 'orders', 'write')).toBe(true)
      expect(hasStaffPermission(role, 'tables', 'read')).toBe(true)
      expect(hasStaffPermission(role, 'reservations', 'read')).toBe(false)
    }
  })

  it('gives the waiter orders, reservations, customers and tables', () => {
    for (const role of WAITER_ROLES) {
      expect(hasStaffPermission(role, 'reservations', 'write')).toBe(true)
      expect(hasStaffPermission(role, 'customers', 'read')).toBe(true)
      expect(hasStaffPermission(role, 'products', 'write')).toBe(false)
    }
  })

  it('gives other roles nothing', () => {
    expect(hasStaffPermission('customer', 'orders', 'read')).toBe(false)
  })
})

describe('KitchenDashboard orders', () => {
  beforeEach(() => { selects.length = 0 })

  it('reads the table from table_number instead of embedding tables', async () => {
    asRole('kitchen')
    render(<KitchenDashboard />)
    expect(await screen.findByText('Mesa 5')).toBeInTheDocument()
    expect(selects.join(' ')).not.toMatch(/tables\s*\(/)
  })
})
