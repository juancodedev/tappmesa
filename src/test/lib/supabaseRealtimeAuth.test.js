import { describe, it, expect, vi, beforeEach } from 'vitest'

// call-waiter T3 (S9, S10): the staff JWT must authorize the Realtime socket,
// not only PostgREST headers; otherwise postgres_changes run as anon and RLS
// filters out every waiter call.

const created = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key, opts) => {
    const client = {
      opts,
      realtime: { setAuth: vi.fn() },
      removeAllChannels: vi.fn(async () => []),
    }
    created.push(client)
    return client
  }),
}))

describe('setAccessToken', () => {
  let mod

  beforeEach(async () => {
    created.length = 0
    vi.resetModules()
    mod = await import('../../lib/supabase.js')
  })

  it('keeps sending the JWT as the PostgREST Authorization header', () => {
    mod.setAccessToken('jwt-1')

    expect(mod.supabase.opts.global.headers.Authorization).toBe('Bearer jwt-1')
  })

  it('authorizes the Realtime socket with the same JWT', () => {
    mod.setAccessToken('jwt-1')

    expect(mod.supabase.realtime.setAuth).toHaveBeenCalledWith('jwt-1')
  })

  it('does not authorize Realtime when the JWT is cleared', () => {
    mod.setAccessToken(null)

    expect(mod.supabase.opts.global).toBeUndefined()
    expect(mod.supabase.realtime.setAuth).not.toHaveBeenCalled()
  })

  it('closes the previous client channels and notifies listeners of the new client', () => {
    const listener = vi.fn()
    const unsubscribe = mod.onSupabaseClientChange(listener)
    const previous = mod.supabase

    mod.setAccessToken('jwt-2')

    expect(previous.removeAllChannels).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(mod.supabase)

    unsubscribe()
    mod.setAccessToken('jwt-3')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
