import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Admin button adoption, slice T1 (odd/tasks/admin-button-adoption.md):
// action buttons use ui/Button (44px via min-h-11) and every icon-only
// control has an accessible name.

const rows = {
  products: [{ id: 'p1', name: 'Latte', price: 3500, is_available: true, is_featured: false, category_id: 'c1', categories: { name: 'Café' } }],
  categories: [{ id: 'c1', name: 'Café', sort_order: 1, is_active: true }],
}

const chain = (table) => {
  const result = { data: rows[table] || [], error: null }
  const q = {}
  for (const m of ['select', 'eq', 'order', 'in', 'neq', 'limit', 'update', 'insert', 'delete']) q[m] = () => q
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

import ProductsManager from '../../components/admin/ProductsManager'
import CategoriesManager from '../../components/admin/CategoriesManager'

const TOUCH = 'min-h-11'

describe('ProductsManager buttons', () => {
  it('uses Button for the main actions', async () => {
    render(<ProductsManager />)
    await screen.findByText('Latte')
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /editar latte/i })).toHaveClass(TOUCH)
  })

  it('names every icon-only control', async () => {
    render(<ProductsManager />)
    await screen.findByText('Latte')
    expect(screen.getByRole('button', { name: 'Eliminar Latte' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Ocultar Latte' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Destacar Latte' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('uses Button in the form footer', async () => {
    render(<ProductsManager />)
    await screen.findByText('Latte')
    await userEvent.click(screen.getByRole('button', { name: /nuevo producto/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: /crear/i })).toHaveClass(TOUCH)
  })
})

describe('CategoriesManager buttons', () => {
  it('uses Button for the main actions and names row controls', async () => {
    render(<CategoriesManager />)
    await screen.findAllByText('Café')
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar Café' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Eliminar Café' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Subir Café' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bajar Café' })).toBeDisabled()
  })
})
