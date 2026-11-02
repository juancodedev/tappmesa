import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

let tenantValue

vi.mock('../../hooks/useTenant', () => ({ useTenant: () => tenantValue }))
vi.mock('../../hooks/useTenantHooks', () => ({ useTenantUrl: () => '/' }))
vi.mock('../../context/CartContext', () => ({ CartProvider: ({ children }) => children }))
vi.mock('../../components/layout/MenuLayout', () => ({ default: () => <p>menu</p> }))
vi.mock('../../components/table/TableOrdersHistory', () => ({ default: () => null }))
vi.mock('../../services/api', () => ({
  api: { get: vi.fn(async () => ({ call: null })), post: vi.fn() },
}))

import TableApp from '../../components/TableApp'

const base = {
  tenant: { id: 't1', name: 'Bistro Sunrise' },
  table: { id: 'tb1', number: 'Mesa 1', location: 'interior', capacity: 4, status: 'available' },
  loading: false,
}

describe('TableApp table session banner', () => {
  beforeEach(() => {
    window.location.reload = vi.fn()
  })

  it('warns the customer when the table session is unavailable, keeping the menu visible', async () => {
    tenantValue = { ...base, tableSession: null, tableSessionError: 'No pudimos conectar con la mesa. Recarga la página o avisa al personal.' }
    const user = userEvent.setup()
    render(<TableApp />)

    expect(screen.getByRole('alert')).toHaveTextContent(/no pudimos conectar con la mesa/i)
    expect(screen.getByText('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /recargar/i }))
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('shows no banner for a healthy session', () => {
    tenantValue = { ...base, tableSession: { capability_token: 'ts_x' }, tableSessionError: null }
    render(<TableApp />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('TableApp call waiter button (call-waiter S1)', () => {
  it('offers "Llamar al mesero" on both tabs with a valid session', async () => {
    tenantValue = { ...base, tableSession: { capability_token: 'ts_x' }, tableSessionError: null }
    const user = userEvent.setup()
    render(<TableApp />)

    expect(await screen.findByRole('button', { name: /llamar al mesero/i })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /mis pedidos/i }))
    expect(screen.getByRole('button', { name: /llamar al mesero/i })).toBeInTheDocument()
  })

  it('hides the button without a table session', () => {
    tenantValue = { ...base, tableSession: null, tableSessionError: 'Sin sesión' }
    render(<TableApp />)
    expect(screen.queryByRole('button', { name: /llamar al mesero/i })).not.toBeInTheDocument()
  })
})
