import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'

// Analytics "Llamados de mesa": attention time of waiter calls (total and per
// staff user), read from get_waiter_call_stats
// (database/create-waiter-call-stats.sql). Staff names come from
// /api/admin/users because admin_users is not readable from the browser.

const rpc = vi.fn()
const authenticatedFetch = vi.fn()
vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: (...args) => rpc(...args) },
  authService: { authenticatedFetch: (...args) => authenticatedFetch(...args) },
}))

import WaiterCallStats from '../../components/admin/analytics/WaiterCallStats'

const range = { from: new Date('2026-10-27T03:00:00Z'), to: new Date('2026-11-03T03:00:00Z') }

const stats = (overrides = {}) => ({
  summary: {
    total: 7, attended: 3, expired: 2, cancelled: 1, pending: 1,
    avg_seconds: 120, median_seconds: 90, max_seconds: 240,
  },
  by_staff: [
    { staff_id: 'u1', attended: 2, avg_seconds: 60, median_seconds: 60, max_seconds: 90 },
    { staff_id: 'u2', attended: 1, avg_seconds: 245, median_seconds: 245, max_seconds: 245 },
    { staff_id: null, attended: 1, avg_seconds: 10, median_seconds: 10, max_seconds: 10 },
  ],
  ...overrides,
})

const usersResponse = (users) => ({ ok: true, json: async () => ({ users }) })

beforeEach(() => {
  rpc.mockReset()
  authenticatedFetch.mockReset()
  authenticatedFetch.mockResolvedValue(usersResponse([
    { id: 'u1', full_name: 'Juan Mesero' },
    { id: 'u2', full_name: 'Ana Admin' },
  ]))
})

describe('WaiterCallStats', () => {
  it('queries the calls of the local and period', async () => {
    rpc.mockResolvedValue({ data: stats(), error: null })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    await screen.findByText('2 min 00 s')
    expect(rpc).toHaveBeenCalledWith('get_waiter_call_stats', {
      p_tenant_id: 't1',
      p_from: range.from.toISOString(),
      p_to: range.to.toISOString(),
    })
  })

  it('shows the average, median and slowest attention time with the call counts', async () => {
    rpc.mockResolvedValue({ data: stats(), error: null })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    const panel = await screen.findByRole('region', { name: 'Llamados de mesa' })
    const value = (label) => within(panel).getByText(label, { selector: 'dt' }).nextElementSibling.textContent
    await within(panel).findByText('2 min 00 s')
    expect(value('Tiempo promedio')).toBe('2 min 00 s')
    expect(value('Mediana')).toBe('1 min 30 s')
    expect(value('Más lento')).toBe('4 min 00 s')
    expect(value('Atendidos')).toBe('3 de 7')
    expect(value('Vencidos sin atender')).toBe('2')
  })

  it('lists each staff user with their calls and times, naming unknown users', async () => {
    rpc.mockResolvedValue({ data: stats(), error: null })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    const table = await screen.findByRole('table', { name: /por mesero/i })
    await within(table).findByText('Juan Mesero')
    const rows = within(table).getAllByRole('row').slice(1).map((r) =>
      within(r).getAllByRole('cell').map((c) => c.textContent)
    )
    expect(rows).toEqual([
      ['Juan Mesero', '2', '1 min 00 s', '1 min 30 s'],
      ['Ana Admin', '1', '4 min 05 s', '4 min 05 s'],
      ['Sin identificar', '1', '10 s', '10 s'],
    ])
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/admin/users')
  })

  it('asks the users API for the selected local when the super admin picked one', async () => {
    rpc.mockResolvedValue({ data: stats(), error: null })
    render(<WaiterCallStats tenantId="t 9" range={range} isSuperAdmin />)

    await screen.findByRole('table', { name: /por mesero/i })
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/admin/users?tenant_id=t%209')
  })

  it('still shows the times when the staff names cannot be loaded', async () => {
    authenticatedFetch.mockResolvedValue({ ok: false, json: async () => ({}) })
    rpc.mockResolvedValue({ data: stats(), error: null })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    const table = await screen.findByRole('table', { name: /por mesero/i })
    expect(within(table).getAllByText('Sin identificar')).toHaveLength(3)
  })

  it('says there were no calls in the period', async () => {
    rpc.mockResolvedValue({
      data: stats({
        summary: { total: 0, attended: 0, expired: 0, cancelled: 0, pending: 0, avg_seconds: null, median_seconds: null, max_seconds: null },
        by_staff: [],
      }),
      error: null,
    })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    expect(await screen.findByText('Sin llamados en este período.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('reports a load error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    render(<WaiterCallStats tenantId="t1" range={range} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los llamados de mesa.')
  })
})
