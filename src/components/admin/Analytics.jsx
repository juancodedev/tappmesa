import { useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import { periodRange, localDateString } from '../../utils/analyticsRange'
import LoadingSpinner from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'
import PeriodFilter from './analytics/PeriodFilter'
import KpiGrid from './analytics/KpiGrid'
import { DailySalesChart, HourlyOrdersChart } from './analytics/AnalyticsCharts'
import { InProgress, TopProducts, Categories, SalesByTable, LocalsRanking } from './analytics/BreakdownTables'

// Reads get_analytics (database/analytics-functions.sql). Tenant admins see
// their own local; the super admin follows the global tenant selector, where
// no selection (null) means all locals plus a ranking.
const Analytics = () => {
  const { user, isSuperAdmin } = useAuth()
  const superAdminContext = useContext(SuperAdminContext)
  const tenantId = isSuperAdmin ? superAdminContext?.selectedTenantId ?? null : user?.tenant_id ?? null

  const [period, setPeriod] = useState('7d')
  const [custom, setCustom] = useState(() => {
    const { from, to } = periodRange('7d')
    return { from: localDateString(from), to: localDateString(new Date(to - 1)) }
  })
  const [reloadKey, setReloadKey] = useState(0)
  // The latest response, tagged with the request it answers; loading is derived
  // from whether that tag matches the current request.
  const [result, setResult] = useState({ request: null, data: null, error: null })

  const range = useMemo(() => periodRange(period, new Date(), custom), [period, custom])
  const canQuery = isSuperAdmin || Boolean(tenantId)
  const request = `${tenantId}|${range.from.toISOString()}|${range.to.toISOString()}|${reloadKey}`

  useEffect(() => {
    if (!canQuery) return
    let ignore = false
    supabase
      .rpc('get_analytics', {
        p_tenant_id: tenantId,
        p_from: range.from.toISOString(),
        p_to: range.to.toISOString(),
      })
      .then(({ data, error }) => {
        if (ignore) return
        // On error drop the old numbers: they belong to another local or period.
        setResult(error ? { request, data: null, error } : { request, data, error: null })
      })
    return () => {
      ignore = true
    }
  }, [canQuery, tenantId, range, request])

  const changePeriod = (id, customRange) => {
    if (customRange) setCustom(customRange)
    setPeriod(id)
  }

  const scope = isSuperAdmin
    ? tenantId
      ? superAdminContext?.tenants?.find((t) => t.id === tenantId)?.name ?? 'Local seleccionado'
      : 'Todos los locales'
    : null

  if (!canQuery) {
    return <p className="p-6 text-gray-600">No hay un local asociado a tu cuenta.</p>
  }

  const loading = result.request !== request
  const { data, error } = result

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Analíticas</h2>
          {scope && <p className="text-sm text-gray-600">{scope}</p>}
        </div>
        <PeriodFilter period={period} custom={custom} onChange={changePeriod} />
      </header>

      {error && !loading && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudieron cargar las analíticas. Intenta de nuevo.
          <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
            Reintentar
          </Button>
        </div>
      )}

      {!data && loading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {data && (
        <div className={`space-y-4 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          <KpiGrid summary={data.summary} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DailySalesChart daily={data.daily} />
            <HourlyOrdersChart hourly={data.hourly} />
          </div>
          {data.locals && <LocalsRanking locals={data.locals} />}
          <div className="grid gap-4 lg:grid-cols-3">
            <InProgress counts={data.in_progress} />
            <TopProducts products={data.top_products} />
            <Categories categories={data.categories} />
          </div>
          <SalesByTable tables={data.tables} />
        </div>
      )}
    </div>
  )
}

export default Analytics
