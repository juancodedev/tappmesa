import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuperAdminContext } from '../../context/SuperAdminContext'

// Analytics dashboard, slice T2 (odd/tasks/analytics-dashboard.md, S1/S6):
// /admin/analytics reads get_analytics for the tenant admin's own local, and
// for the super admin follows the global tenant selector (null = all locals).

const zeroHours = Array.from({ length: 24 }, (_, hour) => ({ hour, sales: 0, orders: 0 }))
const analytics = (overrides = {}) => ({
  summary: {
    current: { sales: 3000, orders: 2, average_ticket: 1500, cancelled: 1, total_orders: 4, cancellation_rate: 0.25 },
    previous: { sales: 1500, orders: 1, average_ticket: 1500, cancelled: 0, total_orders: 1, cancellation_rate: 0 },
  },
  daily: [{ date: '2026-10-29', sales: 3000, orders: 2 }, { date: '2026-10-30', sales: 0, orders: 0 }],
  hourly: zeroHours.map((h) => (h.hour === 13 ? { hour: 13, sales: 3000, orders: 2 } : h)),
  in_progress: { pending: 3, preparing: 1, ready: 2 },
  top_products: [
    { product_id: 'p1', name: 'Latte', category: 'Café', units: 6, revenue: 1800 },
    { product_id: null, name: null, category: null, units: 1, revenue: 1200 },
  ],
  categories: [{ category_id: 'c1', name: 'Café', units: 6, revenue: 1800 }],
  tables: [{ table_number: null, sales: 2000, orders: 1 }, { table_number: '5', sales: 1000, orders: 1 }],
  locals: null,
  ...overrides,
})

const rpc = vi.fn()
vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: (...args) => rpc(...args) },
}))

let auth
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => auth }))

import Analytics from '../../components/admin/Analytics'

const DAY = 24 * 60 * 60 * 1000
const lastRange = () => {
  const [, params] = rpc.mock.calls.at(-1)
  return { ...params, days: (new Date(params.p_to) - new Date(params.p_from)) / DAY }
}

const renderAsTenant = () => {
  auth = { user: { tenant_id: 't1', role: 'tenant_admin' }, isSuperAdmin: false }
  return render(<Analytics />)
}

const renderAsSuperAdmin = (selectedTenantId) => {
  auth = { user: { tenant_id: null, role: 'super_admin' }, isSuperAdmin: true }
  return render(
    <SuperAdminContext.Provider value={{ selectedTenantId, tenants: [] }}>
      <Analytics />
    </SuperAdminContext.Provider>
  )
}

beforeAll(() => {
  // recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue({ data: analytics(), error: null })
})

describe('Analytics (tenant admin)', () => {
  it('asks get_analytics for its own local over the last 7 days by default', async () => {
    renderAsTenant()
    await screen.findByRole('group', { name: 'Ventas' })
    expect(rpc).toHaveBeenCalledWith('get_analytics', expect.objectContaining({ p_tenant_id: 't1' }))
    expect(lastRange().days).toBe(7)
  })

  it('shows the KPIs and their change against the previous period', async () => {
    renderAsTenant()
    const sales = await screen.findByRole('group', { name: 'Ventas' })
    expect(within(sales).getByText('$3.000')).toBeInTheDocument()
    expect(within(sales).getByText('+100% vs período anterior')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Pedidos' })).getByText('2')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Ticket promedio' })).getByText('Sin cambio vs período anterior')).toBeInTheDocument()
    const cancel = screen.getByRole('group', { name: 'Cancelación' })
    expect(within(cancel).getByText('25%')).toBeInTheDocument()
    expect(within(cancel).getByText('+25 pts vs período anterior')).toBeInTheDocument()
  })

  it('shows orders in progress by status', async () => {
    renderAsTenant()
    const inProgress = await screen.findByRole('region', { name: 'Pedidos en curso' })
    expect(within(inProgress).getByText('Pendientes').nextSibling).toHaveTextContent('3')
    expect(within(inProgress).getByText('En preparación').nextSibling).toHaveTextContent('1')
    expect(within(inProgress).getByText('Listos').nextSibling).toHaveTextContent('2')
  })

  it('labels orders without a table and deleted products', async () => {
    renderAsTenant()
    const tables = await screen.findByRole('table', { name: 'Ventas por mesa' })
    expect(within(tables).getByText('Sin mesa')).toBeInTheDocument()
    expect(within(tables).getByText('Mesa 5')).toBeInTheDocument()
    const products = screen.getByRole('table', { name: 'Productos más vendidos' })
    expect(within(products).getByText('Latte')).toBeInTheDocument()
    expect(within(products).getByText('Producto eliminado')).toBeInTheDocument()
  })

  it('has a table view of the daily and hourly charts', async () => {
    renderAsTenant()
    const daily = await screen.findByRole('table', { name: 'Ventas por día' })
    expect(within(daily).getAllByRole('row')).toHaveLength(3)
    const hourly = screen.getByRole('table', { name: 'Pedidos por hora' })
    expect(within(hourly).getAllByRole('row')).toHaveLength(25)
  })

  it('reloads for the chosen period', async () => {
    const user = userEvent.setup()
    renderAsTenant()
    await screen.findByRole('group', { name: 'Ventas' })
    await user.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(lastRange().days).toBe(1)
    await user.click(screen.getByRole('button', { name: '30 días' }))
    expect(lastRange().days).toBe(30)
  })

  it('reloads for a custom range, both dates included', async () => {
    const user = userEvent.setup()
    renderAsTenant()
    await screen.findByRole('group', { name: 'Ventas' })
    await user.click(screen.getByRole('button', { name: 'Personalizado' }))
    const from = screen.getByLabelText('Desde')
    const to = screen.getByLabelText('Hasta')
    await user.clear(from)
    await user.type(from, '2026-10-01')
    await user.clear(to)
    await user.type(to, '2026-10-03')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(lastRange()).toMatchObject({ p_from: '2026-10-01T03:00:00.000Z', days: 3 })
  })

  it('shows the error and does not render the stock screen', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'forbidden' } })
    renderAsTenant()
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las analíticas')
    expect(screen.queryByText(/Gestión de Stock/i)).not.toBeInTheDocument()
  })

  it('has no locals ranking', async () => {
    renderAsTenant()
    await screen.findByRole('group', { name: 'Ventas' })
    expect(screen.queryByRole('table', { name: 'Ranking de locales' })).not.toBeInTheDocument()
  })
})

describe('Analytics (super admin)', () => {
  it('asks for all locals and ranks them when no tenant is selected', async () => {
    rpc.mockResolvedValue({
      data: analytics({
        locals: [
          { tenant_id: 't2', name: 'Bistro', is_active: true, sales: 5000, orders: 1, average_ticket: 5000, cancellation_rate: 0 },
          { tenant_id: 't1', name: 'Café Luna', is_active: false, sales: 3000, orders: 2, average_ticket: 1500, cancellation_rate: 0.25 },
        ],
      }),
      error: null,
    })
    renderAsSuperAdmin(null)
    const ranking = await screen.findByRole('table', { name: 'Ranking de locales' })
    expect(rpc).toHaveBeenCalledWith('get_analytics', expect.objectContaining({ p_tenant_id: null }))
    const rows = within(ranking).getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Bistro')
    expect(rows[0]).toHaveTextContent('$5.000')
    expect(rows[1]).toHaveTextContent('Café Luna')
    expect(rows[1]).toHaveTextContent('Inactivo')
    expect(screen.getByText('Todos los locales')).toBeInTheDocument()
  })

  it('follows the selected tenant', async () => {
    renderAsSuperAdmin('t9')
    await screen.findByRole('group', { name: 'Ventas' })
    expect(rpc).toHaveBeenCalledWith('get_analytics', expect.objectContaining({ p_tenant_id: 't9' }))
    expect(screen.queryByRole('table', { name: 'Ranking de locales' })).not.toBeInTheDocument()
  })
})
