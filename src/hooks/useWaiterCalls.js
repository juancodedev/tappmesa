// src/hooks/useWaiterCalls.js
//
// Staff side of the call-waiter feature (odd/tasks/call-waiter.md T3):
// pending calls of the tenant, oldest first, refreshed from Supabase Realtime.
// Reads and resolutions use the staff claim JWT; RLS scopes them to the
// tenant and to waiter/admin roles (database/create-waiter-calls.sql).

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, onSupabaseClientChange } from '../lib/supabase'

const CALL_COLUMNS = 'id, table_id, reason, status, created_at, expires_at, table:tables(number)'

// Re-render often enough to drop expired calls and refresh elapsed times.
const CLOCK_TICK_MS = 1000
// Safety net if a Realtime event is missed (socket drop, token refresh).
const SAFETY_RELOAD_MS = 60 * 1000

export function useWaiterCalls(tenantId) {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(Boolean(tenantId))
  const [error, setError] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Tenant whose results may still be applied; a slow load of a previous
  // tenant (or after unmount) is dropped.
  const activeTenantRef = useRef(tenantId)
  // Only the most recent load may apply its result (Realtime bursts and the
  // safety reload can overlap, and responses may arrive out of order).
  const loadSeqRef = useRef(0)

  const load = useCallback(async () => {
    if (!tenantId) return
    if (!supabase) {
      setLoading(false) // no client configured: nothing will ever load
      return
    }
    const seq = ++loadSeqRef.current
    const { data, error: loadError } = await supabase
      .from('waiter_calls')
      .select(CALL_COLUMNS)
      .eq('tenant_id', tenantId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })

    if (activeTenantRef.current !== tenantId || seq !== loadSeqRef.current) return
    if (loadError) {
      setError(loadError)
    } else {
      setCalls(data || [])
      setError(null)
    }
    setNow(Date.now())
    setLoading(false)
  }, [tenantId])

  useEffect(() => {
    activeTenantRef.current = tenantId
    if (!tenantId) return undefined

    let subscription = null
    const subscribe = (client) => {
      if (!client) return
      const channel = client
        .channel(`waiter-calls:${tenantId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'waiter_calls', filter: `tenant_id=eq.${tenantId}` },
          () => {
            load()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') load()
        })
      subscription = { client, channel }
    }

    // First load right after mount, without waiting for Realtime to connect.
    const initialLoad = setTimeout(load, 0)
    subscribe(supabase)

    // setAccessToken builds a new client and closes the old one's channels.
    const stopListening = onSupabaseClientChange((client) => {
      subscribe(client)
      load()
    })
    const tick = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS)
    const safety = setInterval(load, SAFETY_RELOAD_MS)

    return () => {
      activeTenantRef.current = null
      stopListening()
      clearTimeout(initialLoad)
      clearInterval(tick)
      clearInterval(safety)
      if (subscription) subscription.client.removeChannel(subscription.channel)
    }
  }, [tenantId, load])

  const resolve = useCallback(async (callId) => {
    if (!supabase) return { ok: false }
    const { data, error: resolveError } = await supabase
      .from('waiter_calls')
      .update({ status: 'attended' })
      .eq('id', callId)
      .eq('status', 'pending')
      .select('id')

    if (resolveError) return { ok: false, error: resolveError }
    // Attended here or by someone else (or expired): it leaves the list either way.
    setCalls((previous) => previous.filter((c) => c.id !== callId))
    return { ok: (data?.length ?? 0) > 0 }
  }, [])

  const visibleCalls = calls.filter((c) => new Date(c.expires_at).getTime() > now)

  return { calls: visibleCalls, loading, error, resolve, reload: load, now }
}
