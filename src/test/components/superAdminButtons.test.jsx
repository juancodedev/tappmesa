import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SuperAdminContext } from '../../context/SuperAdminContext'

// Admin button adoption, slice T7 (odd/tasks/admin-button-adoption.md):
// super admin screens use ui/Button (44px via min-h-11) and every
// icon-only control has an accessible name.

const now = new Date().toISOString()
const rows = {
  tenants: [{ id: 't1', name: 'Bistro', slug: 'bistro', subdomain: 'bistro-tappmesa', is_active: true, created_at: now }],
  subscription_plans: [{ id: 'pl1', name: 'Básico', description: '', price: 10000, billing_period: 'monthly', is_active: true, features: [], max_tables: 5, max_products: 50, max_users: 3, created_at: now }],
}
const users = [{ id: 'u1', full_name: 'Eva Soto', email: 'eva@x.cl', role: 'admin', is_active: true, tenant_id: 't1', created_at: now }]

const chain = (t) => {
  const q = {}
  for (const m of ['select', 'eq', 'order', 'in', 'neq', 'gte', 'lte', 'limit', 'range', 'update', 'insert', 'delete']) q[m] = () => q
  q.single = () => Promise.resolve({ data: (rows[t] || [])[0] || null, error: null })
  q.maybeSingle = q.single
  q.then = (resolve, reject) => Promise.resolve({ data: rows[t] || [], error: null, count: (rows[t] || []).length }).then(resolve, reject)
  return q
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: (t) => chain(t) },
  authService: { authenticatedFetch: vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ users }) })) },
}))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ isSuperAdmin: true, user: { id: 'sa', role: 'super_admin' } }) }))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }))

import SubscriptionPlansManager from '../../components/admin/SubscriptionPlansManager'
import SuperAdminTenantsManager from '../../components/admin/SuperAdminTenantsManager'
import TenantSubscriptionsManager from '../../components/admin/TenantSubscriptionsManager'
import SystemUsersManager from '../../components/admin/SystemUsersManager'
import SuperAdminReservationsManager from '../../components/admin/SuperAdminReservationsManager'
import SuperAdminTablesManager from '../../components/admin/SuperAdminTablesManager'
import SuperAdminStockManager from '../../components/admin/SuperAdminStockManager'
import SuperAdminProductsManager from '../../components/admin/SuperAdminProductsManager'
import SuperAdminOrdersManager from '../../components/admin/SuperAdminOrdersManager'
import SuperAdminCustomersManager from '../../components/admin/SuperAdminCustomersManager'
import SuperAdminCategoriesManager from '../../components/admin/SuperAdminCategoriesManager'

const TOUCH = 'min-h-11'
// super admins always render inside SuperAdminProvider (SecureAdminApp)
const superAdminValue = { selectedTenantId: 't1', selectedTenant: rows.tenants[0], setSelectedTenantId: vi.fn(), tenants: rows.tenants }
const renderIn = (ui) => render(
  <MemoryRouter>
    <SuperAdminContext.Provider value={superAdminValue}>{ui}</SuperAdminContext.Provider>
  </MemoryRouter>
)

describe('super admin refresh buttons', () => {
  it.each([
    ['SuperAdminTenantsManager', SuperAdminTenantsManager],
    ['TenantSubscriptionsManager', TenantSubscriptionsManager],
    ['SystemUsersManager', SystemUsersManager],
    ['SuperAdminReservationsManager', SuperAdminReservationsManager],
    ['SuperAdminTablesManager', SuperAdminTablesManager],
    ['SuperAdminStockManager', SuperAdminStockManager],
    ['SuperAdminProductsManager', SuperAdminProductsManager],
    ['SuperAdminOrdersManager', SuperAdminOrdersManager],
    ['SuperAdminCustomersManager', SuperAdminCustomersManager],
    ['SuperAdminCategoriesManager', SuperAdminCategoriesManager],
  ])('%s uses Button for Actualizar', async (_name, Screen) => {
    renderIn(<Screen />)
    expect(await screen.findByRole('button', { name: /actualizar/i })).toHaveClass(TOUCH)
  })
})

describe('SubscriptionPlansManager', () => {
  it('uses Button for actions and names plan icon buttons', async () => {
    renderIn(<SubscriptionPlansManager />)
    await screen.findByText('Básico')
    expect(screen.getByRole('button', { name: /nuevo plan/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Desactivar' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar plan Básico' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Eliminar plan Básico' })).toHaveClass(TOUCH)
    await userEvent.click(screen.getByRole('button', { name: /nuevo plan/i }))
    expect(screen.getByRole('button', { name: 'Cerrar formulario' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /crear plan/i })).toHaveClass(TOUCH)
  })
})

describe('SuperAdminTenantsManager rows', () => {
  it('names the row icon buttons per tenant', async () => {
    renderIn(<SuperAdminTenantsManager />)
    await screen.findAllByText('Bistro')
    expect(screen.getByRole('button', { name: 'Ver sitio de Bistro' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Gestionar suscripción de Bistro' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Desactivar Bistro' })).toHaveClass(TOUCH)
  })
})

describe('SystemUsersManager rows', () => {
  it('names the activate toggle per user', async () => {
    renderIn(<SystemUsersManager />)
    await screen.findAllByText('Eva Soto')
    expect(screen.getByRole('button', { name: 'Desactivar Eva Soto' })).toHaveClass(TOUCH)
  })
})
