import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { unassociatedLabels } from './labelAssociation'

// Form label association, slice T2 (odd/tasks/form-labels.md): settings,
// pre-bill, users, table statuses and tables name every control from its label.

const files = [
  'components/admin/Settings.jsx',
  'components/admin/PreBillSettings.jsx',
  'components/admin/UsersManager.jsx',
  'components/admin/TableStatusesManager.jsx',
  'components/admin/TablesManager.jsx',
]

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

describe('settings and staff form labels', () => {
  it.each(files)('%s labels name their controls', (file) => {
    expect(unassociatedLabels(file)).toEqual([])
  })

  it('names the user form fields from their labels', async () => {
    render(<UsersManager />)
    await screen.findByText('Eva Soto')
    await userEvent.click(screen.getByRole('button', { name: /agregar usuario/i }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText(/nombre completo/i)).toHaveAttribute('placeholder', 'Juan Pérez')
    expect(within(dialog).getByLabelText(/^email/i)).toHaveAttribute('type', 'email')
    expect(within(dialog).getByLabelText(/^rol/i)).toHaveValue('staff')
    expect(within(dialog).getByLabelText(/contraseña \*/i)).toHaveAttribute('type', 'password')
  })

  it('names the settings fields and both halves of each color pair', () => {
    render(<Settings />)
    expect(screen.getByLabelText('Nombre del Local')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Zona Horaria')).toHaveValue('America/Santiago')
    expect(screen.getByLabelText('Color Primario')).toHaveAttribute('type', 'color')
    expect(screen.getByLabelText('Código del color primario')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Código del color secundario')).toHaveAttribute('type', 'text')
  })
})
