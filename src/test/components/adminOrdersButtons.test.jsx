import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Admin button adoption, slice T3 (odd/tasks/admin-button-adoption.md):
// orders, reservations and customers screens use ui/Button (44px via
// min-h-11) and every icon-only control has an accessible name.

const now = new Date().toISOString()
const rows = {
  orders: [
    { id: 'o1', order_number: 'A-101', status: 'pending', total: 5000, subtotal: 4200, created_at: now, customer_name: 'Ana', order_items: [] },
    { id: 'o2', order_number: 'A-102', status: 'delivered', total: 3000, subtotal: 2500, created_at: now, customer_name: 'Beto', order_items: [] },
  ],
  reservations: [
    { id: 'r1', customer_name: 'Carla', customer_phone: '+56911111111', reservation_date: '2026-11-02', reservation_time: '20:00', party_size: 2, status: 'pending' },
  ],
  customers: [
    { id: 'c1', name: 'Diego', phone: '+56922222222', email: 'd@x.cl', total_orders: 3, total_spent: 9000, created_at: now, loyalty_points: 10 },
  ],
}

const chain = (table) => {
  const result = { data: rows[table] || [], error: null }
  const q = {}
  for (const m of ['select', 'eq', 'order', 'in', 'neq', 'gte', 'lte', 'limit', 'update', 'insert', 'delete']) q[m] = () => q
  q.single = () => Promise.resolve({ data: (rows[table] || [])[0] || null, error: null })
  q.maybeSingle = q.single
  q.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return q
}

vi.mock('../../lib/supabase', () => ({ supabase: { from: (t) => chain(t) } }))
vi.mock('../../hooks/useTenant', () => ({ useTenant: () => ({ tenant: { id: 't1' } }) }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ isSuperAdmin: false, user: { tenant_id: 't1' } }) }))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }))

import OrdersManager from '../../components/admin/OrdersManager'
import ReservationsManager from '../../components/admin/ReservationsManager'
import CustomersManager from '../../components/admin/CustomersManager'

const TOUCH = 'min-h-11'

describe('OrdersManager buttons', () => {
  it('uses Button for refresh and status actions', async () => {
    render(<OrdersManager />)
    await screen.findByRole('button', { name: 'Preparar' })
    expect(screen.getByRole('button', { name: /actualizar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Preparar' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH, 'bg-red-600')
    expect(screen.getByRole('button', { name: /ver detalles/i })).toHaveClass(TOUCH)
  })

  it('uses Button to close the order detail', async () => {
    render(<OrdersManager />)
    await userEvent.click(await screen.findByRole('button', { name: /ver detalles/i }))
    const dialog = screen.getByRole('dialog')
    const footerClose = within(dialog).getAllByRole('button', { name: 'Cerrar' }).find(b => b.textContent === 'Cerrar')
    expect(footerClose).toHaveClass(TOUCH)
  })
})

describe('ReservationsManager buttons', () => {
  it('uses Button for header and row actions', async () => {
    render(<ReservationsManager />)
    await screen.findByText('Carla')
    expect(screen.getByRole('button', { name: /nueva reserva/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /actualizar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /editar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /confirmar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /^cancelar$/i })).toHaveClass(TOUCH, 'bg-red-600')
  })

  it('uses Button in the edit form footer', async () => {
    render(<ReservationsManager />)
    await userEvent.click(await screen.findByRole('button', { name: /nueva reserva/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: /guardar cambios/i })).toHaveClass(TOUCH)
  })
})

describe('CustomersManager buttons', () => {
  it('names the row icon buttons', async () => {
    render(<CustomersManager />)
    await screen.findAllByText('Diego')
    expect(screen.getByRole('button', { name: 'Ver detalles de Diego' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar Diego' })).toHaveClass(TOUCH)
  })

  it('uses Button in the detail and edit dialogs', async () => {
    render(<CustomersManager />)
    await screen.findAllByText('Diego')
    await userEvent.click(screen.getByRole('button', { name: 'Editar Diego' }))
    // editing must not stack the detail dialog underneath
    const [dialog, ...others] = screen.getAllByRole('dialog')
    expect(others).toHaveLength(0)
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: /guardar cambios/i })).toHaveClass(TOUCH)
  })
})
