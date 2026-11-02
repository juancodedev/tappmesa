import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// call-waiter T5 (odd/tasks/call-waiter.md S8, S9): staff see pending calls,
// oldest first, with table, reason and elapsed time, and mark them attended.

const hook = vi.hoisted(() => ({ value: null, calls: [] }))
vi.mock('../../hooks/useWaiterCalls', () => ({
  useWaiterCalls: (tenantId) => {
    hook.calls.push(tenantId)
    return hook.value
  },
}))

import WaiterCallsList from '../../components/staff/WaiterCallsList'
import WaiterCallsPanel from '../../components/staff/WaiterCallsPanel'
import WaiterCallsBell from '../../components/staff/WaiterCallsBell'

const NOW = new Date('2026-11-02T12:10:00Z').getTime()

const calls = [
  { id: 'c1', reason: 'bill', created_at: '2026-11-02T12:03:00Z', table: { number: '4' } },
  { id: 'c2', reason: 'assistance', created_at: '2026-11-02T12:09:40Z', table: { number: 'Terraza 2' } },
]

describe('WaiterCallsList', () => {
  it('shows table, reason and elapsed time in the given order (S8)', () => {
    render(<WaiterCallsList calls={calls} now={NOW} onResolve={vi.fn()} />)

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Mesa 4')
    expect(items[0]).toHaveTextContent('Pedir la cuenta')
    expect(items[0]).toHaveTextContent('hace 7 min')
    expect(items[1]).toHaveTextContent('Terraza 2')
    expect(items[1]).toHaveTextContent('recién')
  })

  it('calls onResolve with the call id from a labelled "Atendido" button (S8)', async () => {
    const onResolve = vi.fn()
    const user = userEvent.setup()
    render(<WaiterCallsList calls={calls} now={NOW} onResolve={onResolve} />)

    await user.click(screen.getByRole('button', { name: /atendido.*mesa 4/i }))

    expect(onResolve).toHaveBeenCalledWith('c1')
  })

  it('says there are no pending calls when the list is empty', () => {
    render(<WaiterCallsList calls={[]} now={NOW} onResolve={vi.fn()} />)

    expect(screen.getByText(/no hay llamados pendientes/i)).toBeInTheDocument()
  })
})

describe('WaiterCallsPanel (waiter dashboard)', () => {
  beforeEach(() => {
    hook.calls.length = 0
    hook.value = { calls, now: NOW, loading: false, error: null, resolve: vi.fn(async () => ({ ok: true })) }
  })

  it('lists the tenant calls with a pending count (S8, S9)', () => {
    render(<WaiterCallsPanel tenantId="tenant-1" />)

    expect(hook.calls).toContain('tenant-1')
    const region = screen.getByRole('region', { name: /llamados de mesa/i })
    expect(within(region).getAllByRole('listitem')).toHaveLength(2)
    expect(within(region).getByText(/2 pendientes/i)).toBeInTheDocument()
  })

  it('resolves a call and tells when someone else already handled it', async () => {
    hook.value.resolve = vi.fn(async () => ({ ok: false }))
    const user = userEvent.setup()
    render(<WaiterCallsPanel tenantId="tenant-1" />)

    await user.click(screen.getByRole('button', { name: /atendido.*mesa 4/i }))

    expect(hook.value.resolve).toHaveBeenCalledWith('c1')
    expect(screen.getByRole('status')).toHaveTextContent(/ya fue atendido/i)
  })

  it('frees the button and reports an error when resolving throws', async () => {
    hook.value = { ...hook.value, resolve: vi.fn(async () => { throw new Error('network') }) }
    const user = userEvent.setup()
    render(<WaiterCallsPanel tenantId="tenant-1" />)

    await user.click(screen.getByRole('button', { name: /atendido.*mesa 4/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/no pudimos marcar el llamado/i)
    expect(screen.getByRole('button', { name: /atendido.*mesa 4/i })).toBeEnabled()
  })

  it('reports a load error', () => {
    hook.value = { ...hook.value, calls: [], error: { message: 'boom' } }
    render(<WaiterCallsPanel tenantId="tenant-1" />)

    expect(screen.getByRole('alert')).toHaveTextContent(/no pudimos cargar los llamados/i)
  })
})

describe('WaiterCallsBell (admin header)', () => {
  beforeEach(() => {
    hook.calls.length = 0
    hook.value = { calls, now: NOW, loading: false, error: null, resolve: vi.fn(async () => ({ ok: true })) }
  })

  it('shows the pending count and opens the list (S8)', async () => {
    const user = userEvent.setup()
    render(<WaiterCallsBell tenantId="tenant-1" />)

    const bell = screen.getByRole('button', { name: /llamados de mesa: 2 pendientes/i })
    expect(bell).toHaveAttribute('aria-expanded', 'false')

    await user.click(bell)

    expect(bell).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.keyboard('{Escape}')
    expect(bell).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders nothing without a tenant (super admin with no tenant selected)', () => {
    const { container } = render(<WaiterCallsBell tenantId={null} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows a load error inside the bell panel', async () => {
    hook.value = { ...hook.value, calls: [], error: { message: 'boom' } }
    const user = userEvent.setup()
    render(<WaiterCallsBell tenantId="tenant-1" />)

    await user.click(screen.getByRole('button', { name: /llamados de mesa/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/no pudimos cargar los llamados/i)
  })
})
