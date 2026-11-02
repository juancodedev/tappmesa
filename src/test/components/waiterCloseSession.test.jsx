import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Waiter "Cerrar sesión": the order modal offers the same action as the
// list view of TablesGrid (close the table session, free the table).

const db = vi.hoisted(() => ({ updates: [], confirmResult: true }))

vi.mock('../../lib/supabase', () => {
  const chain = (table) => {
    const c = { table }
    for (const k of ['select', 'eq', 'order']) c[k] = vi.fn(() => c)
    c.update = vi.fn((values) => {
      c.values = values
      return c
    })
    c.then = (resolve) => {
      if (c.values) db.updates.push({ table, values: c.values, eq: c.eq.mock.calls })
      return resolve({ data: [], error: null })
    }
    return c
  }
  return { supabase: { from: (t) => chain(t) } }
})
vi.mock('../../hooks/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))
vi.mock('../../hooks/useConfirm', () => ({ useConfirm: () => vi.fn(async () => db.confirmResult) }))

import TablesGrid from '../../pages/waiter/components/TablesGrid'
import CreateOrderModal from '../../pages/waiter/components/CreateOrderModal'

const table = { id: 'tb1', number: '4', capacity: 4 }
const session = { id: 's1', table_id: 'tb1', table: { number: '4' }, orders: [], started_at: new Date().toISOString() }

const expectSessionClosed = () => {
  const sessionUpdate = db.updates.find((u) => u.table === 'table_sessions')
  expect(sessionUpdate.values).toMatchObject({ status: 'closed' })
  expect(sessionUpdate.values.ended_at).toEqual(expect.any(String))
  expect(sessionUpdate.eq).toContainEqual(['id', 's1'])
  const tableUpdate = db.updates.find((u) => u.table === 'tables')
  expect(tableUpdate.values).toEqual({ status: 'available' })
  expect(tableUpdate.eq).toContainEqual(['id', 'tb1'])
}

describe('waiter close table session', () => {
  beforeEach(() => {
    db.updates.length = 0
    db.confirmResult = true
  })

  it('closes the session from the order modal like the list view does', async () => {
    const onSessionClosed = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateOrderModal
        tenant={{ id: 't1' }}
        tables={[table]}
        selectedTable={table}
        activeSessions={[session]}
        onSessionClosed={onSessionClosed}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /cerrar sesión de mesa 4/i }))

    await waitFor(() => expect(onSessionClosed).toHaveBeenCalled())
    expectSessionClosed()
  })

  it('does not close anything when the waiter backs out of the confirmation', async () => {
    db.confirmResult = false
    const onSessionClosed = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateOrderModal
        tenant={{ id: 't1' }}
        tables={[table]}
        selectedTable={table}
        activeSessions={[session]}
        onSessionClosed={onSessionClosed}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /cerrar sesión de mesa 4/i }))

    expect(db.updates).toEqual([])
    expect(onSessionClosed).not.toHaveBeenCalled()
  })

  it('hides the action in the modal when the table has no open session', () => {
    render(
      <CreateOrderModal
        tenant={{ id: 't1' }}
        tables={[table]}
        selectedTable={table}
        activeSessions={[]}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /cerrar sesión de mesa/i })).not.toBeInTheDocument()
  })

  it('keeps closing the session from the list view (existing behavior)', async () => {
    const onRefresh = vi.fn()
    const user = userEvent.setup()
    render(<TablesGrid tables={[table]} activeSessions={[session]} view="list" onCreateOrder={vi.fn()} onRefresh={onRefresh} />)

    await user.click(screen.getByRole('button', { name: /cerrar sesión de mesa 4/i }))

    await waitFor(() => expect(onRefresh).toHaveBeenCalled())
    expectSessionClosed()
  })
})
