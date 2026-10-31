import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unassociatedLabels } from './labelAssociation'

// Form label association, slice T3 (odd/tasks/form-labels.md): every <label>
// in the catalog and stock screens names its control.

const files = [
  'components/admin/ProductsManager.jsx',
  'components/admin/CategoriesManager.jsx',
  'components/admin/StockManager.jsx',
  'components/admin/CompleteStockManager.jsx',
]

describe('catalog and stock form labels', () => {
  it.each(files)('%s labels name their controls', (file) => {
    expect(unassociatedLabels(file)).toEqual([])
  })
})

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

describe('catalog forms are reachable by label', () => {
  it('finds the product create form fields by their labels', async () => {
    render(<ProductsManager />)
    await screen.findByText('Latte')
    await userEvent.click(screen.getByRole('button', { name: /nuevo producto/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/nombre/i)).toHaveAttribute('type', 'text')
    expect(within(dialog).getByLabelText(/^categoría/i).tagName).toBe('SELECT')
    expect(within(dialog).getByLabelText(/precio/i)).toHaveAttribute('type', 'number')
    expect(within(dialog).getByLabelText(/descripción/i).tagName).toBe('TEXTAREA')
    expect(within(dialog).getByRole('group', { name: /imagen del producto/i })).toBeInTheDocument()
  })

  it('finds the category create form fields by their labels', async () => {
    render(<CategoriesManager />)
    await screen.findAllByText('Café')
    await userEvent.click(screen.getByRole('button', { name: /nueva categoría/i }))
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/slug/i)).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/orden de visualización/i)).toHaveAttribute('type', 'number')
  })
})
