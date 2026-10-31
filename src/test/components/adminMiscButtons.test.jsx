import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Admin button adoption, slice T5 (odd/tasks/admin-button-adoption.md):
// users, settings, pre-bill and the admin shell use ui/Button (44px via
// min-h-11) and every icon-only control has an accessible name.

const users = [{ id: 'u1', full_name: 'Eva Soto', email: 'eva@x.cl', role: 'staff', is_active: true, last_login: null }]

const chain = () => {
  const q = {}
  for (const m of ['select', 'eq', 'order', 'in', 'neq', 'limit', 'update', 'insert', 'delete', 'upsert']) q[m] = () => q
  q.single = () => Promise.resolve({ data: null, error: null })
  q.maybeSingle = q.single
  q.then = (resolve, reject) => Promise.resolve({ data: [], error: null }).then(resolve, reject)
  return q
}

vi.mock('../../lib/supabase', () => ({
  supabase: { from: () => chain() },
  authService: {
    authenticatedFetch: vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ users }) })),
  },
}))
const tenant = { id: 't1', name: 'Bistro', settings: {} }
vi.mock('../../hooks/useTenant', () => ({ useTenant: () => ({ tenant, loading: false, loadTenant: vi.fn() }) }))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isSuperAdmin: false,
    user: { id: 'me', tenant_id: 't1', tenant, full_name: 'Admin', email: 'a@x.cl', role: 'admin' },
    logout: vi.fn(),
    hasPermission: () => true,
  }),
}))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn().mockResolvedValue(false) }))

import UsersManager from '../../components/admin/UsersManager'
import Settings from '../../components/admin/Settings'
import PreBillSettings from '../../components/admin/PreBillSettings'
import SecureAdminApp from '../../components/SecureAdminApp'

const TOUCH = 'min-h-11'

describe('UsersManager buttons', () => {
  it('uses Button for actions and names row controls', async () => {
    render(<UsersManager />)
    await screen.findByText('Eva Soto')
    expect(screen.getByRole('button', { name: /agregar usuario/i })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Editar Eva Soto' })).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Eliminar Eva Soto' })).toHaveClass(TOUCH)
  })

  it('names the password toggle and uses Button in the form footer', async () => {
    render(<UsersManager />)
    await screen.findByText('Eva Soto')
    await userEvent.click(screen.getByRole('button', { name: /agregar usuario/i }))
    const dialog = screen.getByRole('dialog')
    const toggle = within(dialog).getByRole('button', { name: 'Mostrar contraseña' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(within(dialog).getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveClass(TOUCH)
    expect(within(dialog).getByRole('button', { name: /crear usuario/i })).toHaveClass(TOUCH)
  })

  // The form offered "customer", which /api/admin/users rejects, and not the
  // waiter/kitchen roles the staff views require.
  it('offers the staff roles the API accepts', async () => {
    render(<UsersManager />)
    await screen.findByText('Eva Soto')
    await userEvent.click(screen.getByRole('button', { name: /agregar usuario/i }))
    const select = within(screen.getByRole('dialog')).getByDisplayValue('Personal')
    const values = within(select).getAllByRole('option').map((o) => o.value)
    expect(values).toEqual(['staff', 'waiter', 'kitchen', 'tenant_admin'])
  })
})

describe('Settings and PreBillSettings buttons', () => {
  it('uses Button for save in settings', () => {
    render(<Settings />)
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toHaveClass(TOUCH)
  })

  it('uses Button for save in pre-bill settings', async () => {
    render(<PreBillSettings />)
    expect(await screen.findByRole('button', { name: /guardar cambios/i })).toHaveClass(TOUCH)
  })
})

describe('Admin shell buttons', () => {
  it('names the header and sidebar icon buttons', async () => {
    render(<MemoryRouter initialEntries={['/settings']}><SecureAdminApp /></MemoryRouter>)
    const open = screen.getByRole('button', { name: 'Abrir menú' })
    expect(open).toHaveClass(TOUCH)
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toHaveClass(TOUCH)
    await userEvent.click(open)
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveClass(TOUCH)
  })
})
