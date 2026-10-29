import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Admin button adoption, slice T4 (odd/tasks/admin-button-adoption.md):
// both stock screens use ui/Button (44px via min-h-11) and every
// icon-only row control has an accessible name.

const now = new Date().toISOString()
const product = { id: 'p1', name: 'Leche', price: 1200, category: { name: 'Lácteos' }, categories: { name: 'Lácteos' } }
const rows = {
  stock_inventory: [{
    id: 'si1', product_id: 'p1', current_stock: 10, min_stock: 2, max_stock: 50,
    cost_per_unit: 800, unit: 'lt', last_updated: now, product, products: product,
  }],
  stock_movements: [],
  stock_alerts: [{ id: 'a1', message: 'Leche bajo mínimo', is_resolved: false, created_at: now }],
  suppliers: [],
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

import StockManager from '../../components/admin/StockManager'
import CompleteStockManager from '../../components/admin/CompleteStockManager'

const TOUCH = 'min-h-11'

describe('StockManager buttons', () => {
  it('names every row icon button', async () => {
    render(<StockManager />)
    await screen.findAllByText('Leche')
    for (const name of ['Agregar stock de Leche', 'Reducir stock de Leche', 'Historial de Leche', 'Editar Leche']) {
      expect(screen.getByRole('button', { name })).toHaveClass(TOUCH)
    }
  })

  it('uses Button in the movement dialog', async () => {
    render(<StockManager />)
    await screen.findAllByText('Leche')
    await userEvent.click(screen.getByRole('button', { name: 'Reducir stock de Leche' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: 'Reducir Stock' })).toHaveClass(TOUCH, 'bg-red-600')
  })
})

describe('CompleteStockManager buttons', () => {
  it('uses Button for header, alerts and row actions', async () => {
    render(<CompleteStockManager />)
    await screen.findAllByText('Leche')
    expect(screen.getByRole('button', { name: /actualizar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /resolver/i })).toHaveClass(TOUCH)
    for (const name of ['Agregar stock de Leche', 'Reducir stock de Leche', 'Ajustar stock de Leche', 'Historial de Leche', 'Editar Leche']) {
      expect(screen.getByRole('button', { name })).toHaveClass(TOUCH)
    }
  })

  it('uses Button in the movement dialog', async () => {
    render(<CompleteStockManager />)
    await screen.findAllByText('Leche')
    await userEvent.click(screen.getByRole('button', { name: 'Reducir stock de Leche' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    // "out" used hover:bg-primary-700 on a red button; it is now destructive
    const submit = within(dialog).getByRole('button', { name: 'Reducir' })
    expect(submit).toHaveClass(TOUCH, 'bg-red-600', 'hover:bg-red-700')
  })
})
