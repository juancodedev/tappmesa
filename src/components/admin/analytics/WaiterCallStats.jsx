import { useEffect, useState } from 'react'
import { supabase, authService } from '../../../lib/supabase'
import { formatCount, formatDuration } from './format'

// How long staff take to attend waiter calls, for the local and period of the
// analytics page. Reads get_waiter_call_stats
// (database/create-waiter-call-stats.sql); staff names come from
// /api/admin/users because admin_users is not readable from the browser.
// tenantId null means all locals (super admin only).

const UNKNOWN_STAFF = 'Sin identificar'

const loadStaffNames = async (tenantId, isSuperAdmin) => {
  const params = isSuperAdmin && tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ''
  try {
    const response = await authService.authenticatedFetch(`/api/admin/users${params}`)
    if (!response.ok) return {}
    const { users = [] } = await response.json()
    return Object.fromEntries(users.map((u) => [u.id, u.full_name || u.email]))
  } catch {
    // Names are a nicety: the times still show without them.
    return {}
  }
}

const WaiterCallStats = ({ tenantId, range, isSuperAdmin = false }) => {
  const [result, setResult] = useState({ request: null, data: null, names: {}, error: null })
  const request = `${tenantId}|${range.from.toISOString()}|${range.to.toISOString()}`

  useEffect(() => {
    let ignore = false
    const stats = supabase
      .rpc('get_waiter_call_stats', {
        p_tenant_id: tenantId,
        p_from: range.from.toISOString(),
        p_to: range.to.toISOString(),
      })
      .then(({ data, error }) => (error ? { data: null, error } : { data, error: null }))
      .catch((error) => ({ data: null, error }))

    Promise.all([stats, loadStaffNames(tenantId, isSuperAdmin)]).then(([{ data, error }, names]) => {
      if (!ignore) setResult({ request, data, names, error })
    })
    return () => {
      ignore = true
    }
  }, [tenantId, range, isSuperAdmin, request])

  const loading = result.request !== request
  const { data, names, error } = result

  return (
    <section aria-label="Llamados de mesa" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">Llamados de mesa</h3>
      <p className="text-xs text-gray-500">Tiempo desde que la mesa llama hasta que se marca atendido</p>

      {error && !loading && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          No se pudieron cargar los llamados de mesa.
        </p>
      )}

      {loading && !data && <p className="mt-3 text-sm text-gray-500">Cargando…</p>}

      {data && data.summary.total === 0 && (
        <p className="mt-3 text-sm text-gray-500">Sin llamados en este período.</p>
      )}

      {data && data.summary.total > 0 && (
        <div className={loading ? 'opacity-60' : ''} aria-busy={loading}>
          <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ['Tiempo promedio', formatDuration(data.summary.avg_seconds)],
              ['Mediana', formatDuration(data.summary.median_seconds)],
              ['Más lento', formatDuration(data.summary.max_seconds)],
              ['Atendidos', `${formatCount(data.summary.attended)} de ${formatCount(data.summary.total)}`],
              ['Vencidos sin atender', formatCount(data.summary.expired)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-xs text-gray-600">{label}</dt>
                <dd className="text-lg font-semibold text-gray-900 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          {data.by_staff.length > 0 && (
            <table className="mt-4 w-full text-left text-sm">
              <caption className="sr-only">Tiempo de atención por mesero</caption>
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500">
                  <th scope="col" className="py-1 font-medium">Mesero</th>
                  <th scope="col" className="py-1 text-right font-medium">Atendidos</th>
                  <th scope="col" className="py-1 text-right font-medium">Promedio</th>
                  <th scope="col" className="py-1 text-right font-medium">Más lento</th>
                </tr>
              </thead>
              <tbody>
                {data.by_staff.map((row, i) => (
                  <tr key={row.staff_id ?? `unknown-${i}`} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-900">{(row.staff_id && names[row.staff_id]) || UNKNOWN_STAFF}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-900">{formatCount(row.attended)}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-900">{formatDuration(row.avg_seconds)}</td>
                    <td className="py-1.5 text-right tabular-nums text-gray-900">{formatDuration(row.max_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  )
}

export default WaiterCallStats
