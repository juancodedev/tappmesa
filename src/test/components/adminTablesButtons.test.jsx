import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Admin button adoption, slice T2 (odd/tasks/admin-button-adoption.md):
// tables, table statuses and QR screens use ui/Button (44px via min-h-11)
// and every icon-only control has an accessible name.

const rows = {
  tables: [{ id: 'tb1', number: 'Mesa 1', unique_code: 'ABCD1234XY', capacity: 4, location: 'Salón', is_active: true, status: 'available' }],
  table_statuses: [
    { id: 's1', name: 'Disponible', color: '#10b981', icon: 'check', order_index: 1, is_system: true },
    { id: 's2', name: 'Limpieza', color: '#f59e0b', icon: 'clock', order_index: 2, is_system: false },
  ],
  tenants: [{ id: 't1', subdomain: 'bistro-tappmesa' }],
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

import TablesManager from '../../components/admin/TablesManager'
import TableStatusesManager from '../../components/admin/TableStatusesManager'
import QRGenerator from '../../components/admin/QRGenerator'

const TOUCH = 'min-h-11'

describe('TablesManager buttons', () => {
  it('uses Button for the main and card actions', async () => {
    render(<TablesManager />)
    await screen.findByText('Mesa 1')
    expect(screen.getByRole('button', { name: /agregar mesa/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Ver QR de Mesa 1' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar Mesa 1' })).toHaveClass(TOUCH)
  })

  it('names the actions menu trigger and reports its state', async () => {
    render(<TablesManager />)
    await screen.findByText('Mesa 1')
    const trigger = screen.getByRole('button', { name: 'Más acciones de Mesa 1' })
    expect(trigger).toHaveClass(TOUCH)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument()
  })

  it('uses Button in the form footer', async () => {
    render(<TablesManager />)
    await screen.findByText('Mesa 1')
    await userEvent.click(screen.getByRole('button', { name: /agregar mesa/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: /crear mesa/i })).toHaveClass(TOUCH)
  })
})

describe('TableStatusesManager buttons', () => {
  it('uses Button for actions and names row controls', async () => {
    render(<TableStatusesManager />)
    await screen.findByText('Limpieza')
    expect(screen.getByRole('button', { name: /nuevo estado/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar Limpieza' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Eliminar Limpieza' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Eliminar Disponible' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Subir Disponible' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Bajar Limpieza' })).toBeDisabled()
  })

  it('uses Button in the edit and create forms', async () => {
    render(<TableStatusesManager />)
    await screen.findByText('Limpieza')
    await userEvent.click(screen.getByRole('button', { name: 'Editar Limpieza' }))
    expect(screen.getByRole('button', { name: /guardar/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /cancelar/i })).toHaveClass(TOUCH)
  })
})

describe('QRGenerator buttons', () => {
  it('uses Button for card actions and names the copy controls', async () => {
    render(<MemoryRouter><QRGenerator /></MemoryRouter>)
    await screen.findByText('Mesa 1')
    expect(screen.getByRole('button', { name: /vista previa/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: /^descargar$/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Copiar código de Mesa 1' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Copiar URL de Mesa 1' })).toHaveClass(TOUCH)
  })

  it('uses Button in the preview dialog', async () => {
    render(<MemoryRouter><QRGenerator /></MemoryRouter>)
    await screen.findByText('Mesa 1')
    await userEvent.click(screen.getByRole('button', { name: /vista previa/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Descargar QR' })).toHaveClass(TOUCH)
    // the Modal header has its own icon "Cerrar"; target the footer one by text
    const footerClose = within(dialog).getAllByRole('button', { name: 'Cerrar' }).find(b => b.textContent === 'Cerrar')
    expect(footerClose).toHaveClass(TOUCH)
  })
})
