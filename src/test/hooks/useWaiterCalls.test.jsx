import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// call-waiter T3 (S8, S9): staff screens load the tenant's pending calls,
// oldest first, and refresh them from Supabase Realtime.

const mocks = vi.hoisted(() => {
  const state = { listResult: { data: [], error: null }, updateResult: { data: [{ id: 'c1' }], error: null } }
  const listeners = new Set()

  function makeClient(name) {
    const client = { name, chains: [], channels: [] }
    client.from = vi.fn(() => {
      const chain = { isUpdate: false }
      for (const key of ['select', 'eq', 'gt', 'order']) chain[key] = vi.fn(() => chain)
      chain.update = vi.fn((values) => {
        chain.isUpdate = true
        chain.values = values
        return chain
      })
      chain.then = (resolve) => {
        if (!chain.isUpdate && state.listDeferred) return state.listDeferred.then(resolve)
        return resolve(chain.isUpdate ? state.updateResult : state.listResult)
      }
      client.chains.push(chain)
      return chain
    })
    client.channel = vi.fn((topic) => {
      const channel = { topic, handlers: [] }
      channel.on = vi.fn((type, filter, handler) => {
        channel.handlers.push({ type, filter, handler })
        return channel
      })
      channel.subscribe = vi.fn((cb) => {
        channel.statusCb = cb
        return channel
      })
      client.channels.push(channel)
      return channel
    })
    client.removeChannel = vi.fn()
    return client
  }

  return { state, listeners, makeClient, current: { client: null } }
})

vi.mock('../../lib/supabase', () => ({
  get supabase() {
    return mocks.current.client
  },
  onSupabaseClientChange: (listener) => {
    mocks.listeners.add(listener)
    return () => mocks.listeners.delete(listener)
  },
}))

import { useWaiterCalls } from '../../hooks/useWaiterCalls'

const minutesFromNow = (m) => new Date(Date.now() + m * 60 * 1000).toISOString()

const call = (overrides = {}) => ({
  id: 'c1',
  table_id: 't1',
  reason: 'bill',
  status: 'pending',
  created_at: new Date().toISOString(),
  expires_at: minutesFromNow(4),
  table: { number: '4' },
  ...overrides,
})

const eqArgs = (chain) => chain.eq.mock.calls.map(([k, v]) => `${k}=${v}`)

describe('useWaiterCalls', () => {
  beforeEach(() => {
    mocks.current.client = mocks.makeClient('first')
    mocks.listeners.clear()
    mocks.state.listResult = { data: [], error: null }
    mocks.state.updateResult = { data: [{ id: 'c1' }], error: null }
    mocks.state.listDeferred = null
  })

  it('loads the pending, unexpired calls of the tenant oldest first (S8)', async () => {
    mocks.state.listResult = { data: [call()], error: null }

    const { result } = renderHook(() => useWaiterCalls('tenant-1'))

    await waitFor(() => expect(result.current.calls).toHaveLength(1))
    const chain = mocks.current.client.chains[0]
    expect(mocks.current.client.from).toHaveBeenCalledWith('waiter_calls')
    expect(eqArgs(chain)).toEqual(expect.arrayContaining(['tenant_id=tenant-1', 'status=pending']))
    expect(chain.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.current.calls[0].table.number).toBe('4')
  })

  it('hides a call whose expiry passed even if the server still lists it (S6)', async () => {
    mocks.state.listResult = { data: [call(), call({ id: 'c2', expires_at: minutesFromNow(-1) })], error: null }

    const { result } = renderHook(() => useWaiterCalls('tenant-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.calls.map((c) => c.id)).toEqual(['c1'])
  })

  it('subscribes to the tenant waiter_calls changes and reloads on each event (S9)', async () => {
    renderHook(() => useWaiterCalls('tenant-1'))

    const channel = mocks.current.client.channels[0]
    expect(channel.handlers[0]).toMatchObject({
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public', table: 'waiter_calls', filter: 'tenant_id=eq.tenant-1' },
    })

    mocks.state.listResult = { data: [call({ id: 'new' })], error: null }
    const loadsBefore = mocks.current.client.from.mock.calls.length
    await act(async () => {
      channel.handlers[0].handler({ eventType: 'INSERT' })
    })

    expect(mocks.current.client.from.mock.calls.length).toBeGreaterThan(loadsBefore)
  })

  it('marks a call attended and removes it from the list (S8)', async () => {
    mocks.state.listResult = { data: [call()], error: null }
    const { result } = renderHook(() => useWaiterCalls('tenant-1'))
    await waitFor(() => expect(result.current.calls).toHaveLength(1))

    let outcome
    await act(async () => {
      outcome = await result.current.resolve('c1')
    })

    const update = mocks.current.client.chains.find((c) => c.isUpdate)
    expect(update.values).toEqual({ status: 'attended' })
    expect(eqArgs(update)).toEqual(expect.arrayContaining(['id=c1', 'status=pending']))
    expect(outcome).toEqual({ ok: true })
    expect(result.current.calls).toHaveLength(0)
  })

  it('reports ok false when the call was already handled by someone else', async () => {
    mocks.state.listResult = { data: [call()], error: null }
    mocks.state.updateResult = { data: [], error: null }
    const { result } = renderHook(() => useWaiterCalls('tenant-1'))
    await waitFor(() => expect(result.current.calls).toHaveLength(1))

    let outcome
    await act(async () => {
      outcome = await result.current.resolve('c1')
    })

    expect(outcome).toEqual({ ok: false })
  })

  it('resubscribes on the new client after the staff JWT is refreshed (S9)', async () => {
    renderHook(() => useWaiterCalls('tenant-1'))
    const second = mocks.makeClient('second')

    await act(async () => {
      mocks.current.client = second
      mocks.listeners.forEach((listener) => listener(second))
    })

    expect(second.channels).toHaveLength(1)
    expect(second.channels[0].handlers[0].filter.filter).toBe('tenant_id=eq.tenant-1')
  })

  it('removes the channel on unmount', () => {
    const { unmount } = renderHook(() => useWaiterCalls('tenant-1'))
    const channel = mocks.current.client.channels[0]

    unmount()

    expect(mocks.current.client.removeChannel).toHaveBeenCalledWith(channel)
  })

  it('ignores a slow load of the previous tenant after switching tenants', async () => {
    let releaseStale
    mocks.state.listDeferred = new Promise((resolve) => {
      releaseStale = () => resolve({ data: [call({ id: 'stale' })], error: null })
    })
    const { result, rerender } = renderHook(({ tenant }) => useWaiterCalls(tenant), {
      initialProps: { tenant: 'tenant-1' },
    })
    await waitFor(() => expect(mocks.current.client.from).toHaveBeenCalled())

    mocks.state.listDeferred = null
    mocks.state.listResult = { data: [call({ id: 'fresh' })], error: null }
    rerender({ tenant: 'tenant-2' })
    await waitFor(() => expect(result.current.calls.map((c) => c.id)).toEqual(['fresh']))

    await act(async () => {
      releaseStale()
    })

    expect(result.current.calls.map((c) => c.id)).toEqual(['fresh'])
  })

  it('stops loading when there is no Supabase client', async () => {
    mocks.current.client = null

    const { result } = renderHook(() => useWaiterCalls('tenant-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.calls).toEqual([])
  })

  it('does nothing without a tenant', () => {
    renderHook(() => useWaiterCalls(null))

    expect(mocks.current.client.from).not.toHaveBeenCalled()
    expect(mocks.current.client.channel).not.toHaveBeenCalled()
  })
})
