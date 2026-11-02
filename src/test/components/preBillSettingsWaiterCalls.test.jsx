import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// call-waiter T5 (odd/tasks/call-waiter.md S7): the tenant admin turns
// "Llamar al mesero" on or off; it is stored in tenants.waiter_calls_enabled.

const db = vi.hoisted(() => ({ updates: [] }))

vi.mock('../../lib/supabase', () => {
  const chain = (table) => {
    const c = {}
    for (const key of ['select', 'eq', 'order', 'limit', 'insert']) c[key] = vi.fn(() => c)
    c.update = vi.fn((values) => {
      db.updates.push({ table, values })
      return c
    })
    c.maybeSingle = vi.fn(async () => ({ data: null, error: null }))
    c.single = c.maybeSingle
    c.then = (resolve) => resolve({ data: [{ id: 't1' }], error: null })
    return c
  }
  return { supabase: { from: vi.fn((table) => chain(table)) } }
})

const tenantState = vi.hoisted(() => ({ tenant: null }))
vi.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ tenant: tenantState.tenant, loading: false, loadTenant: vi.fn() }),
}))
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'me', tenant_id: 't1', tenant: tenantState.tenant, role: 'tenant_admin' },
    isSuperAdmin: false,
  }),
}))
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

import PreBillSettings from '../../components/admin/PreBillSettings'

describe('PreBillSettings — waiter calls toggle (S7)', () => {
  beforeEach(() => {
    db.updates.length = 0
  })

  it('shows the toggle on by default and saves it turned off', async () => {
    tenantState.tenant = { id: 't1', name: 'Bistro', tip_percentage: 10, show_survey: false }
    const user = userEvent.setup()
    render(<PreBillSettings />)

    const toggle = await screen.findByRole('checkbox', { name: /permitir que los clientes llamen al mesero/i })
    expect(toggle).toBeChecked()

    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      const tenantUpdate = db.updates.find((u) => u.table === 'tenants')
      expect(tenantUpdate.values).toMatchObject({ waiter_calls_enabled: false })
    })
  })

  it('loads a disabled tenant unchecked and keeps the other settings in the same update', async () => {
    tenantState.tenant = { id: 't1', name: 'Bistro', tip_percentage: 12, show_survey: false, waiter_calls_enabled: false }
    const user = userEvent.setup()
    render(<PreBillSettings />)

    const toggle = await screen.findByRole('checkbox', { name: /permitir que los clientes llamen al mesero/i })
    expect(toggle).not.toBeChecked()

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => {
      const tenantUpdate = db.updates.find((u) => u.table === 'tenants')
      expect(tenantUpdate.values).toMatchObject({ tip_percentage: 12, show_survey: false, waiter_calls_enabled: false })
    })
  })
})
