import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Admin button adoption, slice T6 (odd/tasks/admin-button-adoption.md):
// waiter and kitchen screens use ui/Button (44px via min-h-11) and every
// icon-only control has an accessible name.

const now = new Date().toISOString()
const table = { id: 'tb1', number: '1', capacity: 4, status: 'occupied', is_active: true }
const rows = {
  tables: [table],
  table_sessions: [],
  products: [{ id: 'p1', name: 'Latte', price: 3500, is_available: true, category_id: 'c1' }],
  categories: [],
  orders: [{ id: 'o1', order_number: 'K-7', status: 'pending', total: 3500, created_at: now, table: { number: '1' }, order_items: [] }],
}

const chain = (t) => {
  const q = {}
  for (const m of ['select', 'eq', 'order', 'in', 'neq', 'gte', 'lte', 'limit', 'update', 'insert', 'delete']) q[m] = () => q
  q.single = () => Promise.resolve({ data: (rows[t] || [])[0] || null, error: null })
  q.maybeSingle = q.single
  q.then = (resolve, reject) => Promise.resolve({ data: rows[t] || [], error: null }).then(resolve, reject)
  return q
}

vi.mock('../../lib/supabase', () => ({ supabase: { from: (t) => chain(t) } }))
vi.mock('../../hooks/useTenant', () => ({ useTenant: () => ({ tenant: { id: 't1', name: 'Bistro' }, loading: false }) }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { tenant_id: 't1', role: 'cocina', full_name: 'Chef' }, logout: vi.fn() }) }))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }))

import WaiterDashboard from '../../pages/waiter/WaiterDashboard'
import TablesGrid from '../../pages/waiter/components/TablesGrid'
import ActiveOrdersPanel from '../../pages/waiter/components/ActiveOrdersPanel'
import CreateOrderModal from '../../pages/waiter/components/CreateOrderModal'
import KitchenDashboard from '../../pages/kitchen/KitchenDashboard'

const TOUCH = 'min-h-11'
const session = { id: 's1', table_id: 'tb1', table, started_at: now, total_amount: 3500, orders: [{ id: 'o1', order_number: 'W-1', status: 'pending', total: 3500, created_at: now }] }

describe('WaiterDashboard header', () => {
  it('uses Button and names icon-only controls', async () => {
    render(<WaiterDashboard />)
    expect(await screen.findByRole('button', { name: 'Actualizar' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /admin/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /nueva reserva/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /nuevo pedido/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Vista cuadrícula' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Vista lista' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('TablesGrid list actions', () => {
  it('names the row icon buttons per table', () => {
    render(<TablesGrid tables={[table, { ...table, id: 'tb2', number: '2' }]} activeSessions={[session]} view="list" onCreateOrder={vi.fn()} onRefresh={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Agregar pedido a Mesa 1' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Cerrar sesión de Mesa 1' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Iniciar sesión en Mesa 2' })).toHaveClass(TOUCH)
  })
})

describe('ActiveOrdersPanel', () => {
  it('uses Button for the next-status action', () => {
    render(<ActiveOrdersPanel activeSessions={[session]} onRefresh={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Iniciar preparación' })).toHaveClass(TOUCH)
  })
})

describe('CreateOrderModal cart', () => {
  it('names the cart controls and uses Button to submit', async () => {
    render(<CreateOrderModal tenant={{ id: 't1' }} tables={[table]} selectedTable={table} onClose={vi.fn()} onSuccess={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /latte/i }))
    expect(screen.getByRole('button', { name: 'Quitar Latte' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Restar un Latte' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Sumar un Latte' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /crear pedido/i })).toHaveClass('min-h-12') // size lg
  })
})

describe('KitchenDashboard', () => {
  it('uses Button for header and order actions', async () => {
    render(<KitchenDashboard />)
    expect(await screen.findByRole('button', { name: /comenzar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Actualizar pedidos' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Salir' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Cancelar pedido #K-7' })).toHaveClass(TOUCH)
  })
})
