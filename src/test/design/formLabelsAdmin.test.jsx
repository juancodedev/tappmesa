import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unassociatedLabels } from './labelAssociation'

// Form label association, slice T4 (odd/tasks/form-labels.md): every
// <label> in the reservations, customers and subscription admin screens
// names its control, so screen readers announce the field.

const now = new Date().toISOString()
const rows = {
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

import ReservationsManager from '../../components/admin/ReservationsManager'
import CustomersManager from '../../components/admin/CustomersManager'

const files = [
  'components/admin/ReservationsManager.jsx',
  'components/admin/CustomersManager.jsx',
  'components/admin/TenantSubscriptionsManager.jsx',
  'components/admin/SubscriptionPlansManager.jsx',
  'components/admin/SuperAdminTenantsManager.jsx',
]

describe('admin form labels (guard)', () => {
  it.each(files)('%s labels name their controls', (file) => {
    expect(unassociatedLabels(file)).toEqual([])
  })
})

describe('admin form labels (rendered)', () => {
  it('names the reservation form fields', async () => {
    render(<ReservationsManager />)
    await userEvent.click(await screen.findByRole('button', { name: /nueva reserva/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/nombre del cliente/i)).toHaveAttribute('type', 'text')
    expect(within(dialog).getByLabelText(/teléfono/i)).toHaveAttribute('type', 'tel')
    expect(within(dialog).getByLabelText(/^fecha/i)).toHaveAttribute('type', 'date')
    expect(within(dialog).getByLabelText(/solicitudes especiales/i).tagName).toBe('TEXTAREA')
  })

  it('names the customer edit form fields', async () => {
    render(<CustomersManager />)
    await screen.findAllByText('Diego')
    await userEvent.click(screen.getByRole('button', { name: 'Editar Diego' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('Nombre')).toHaveValue('Diego')
    expect(within(dialog).getByLabelText('Teléfono')).toHaveValue('+56922222222')
    expect(within(dialog).getByLabelText('Email')).toHaveValue('d@x.cl')
    expect(within(dialog).getByLabelText('Notas').tagName).toBe('TEXTAREA')
  })
})
