import { formatCLP, formatCount, formatPercent, formatChange, formatPointsChange } from './format'

const Kpi = ({ label, value, change }) => (
  <div role="group" aria-label={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-medium text-gray-600">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
    <p className="mt-1 text-xs text-gray-500">{change}</p>
  </div>
)

const KpiGrid = ({ summary }) => {
  const { current, previous } = summary
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label="Ventas" value={formatCLP(current.sales)} change={formatChange(current.sales, previous.sales)} />
      <Kpi label="Pedidos" value={formatCount(current.orders)} change={formatChange(current.orders, previous.orders)} />
      <Kpi
        label="Ticket promedio"
        value={formatCLP(current.average_ticket)}
        change={formatChange(current.average_ticket, previous.average_ticket)}
      />
      <Kpi
        label="Cancelación"
        value={formatPercent(current.cancellation_rate)}
        change={formatPointsChange(current.cancellation_rate, previous.cancellation_rate)}
      />
    </div>
  )
}

export default KpiGrid
