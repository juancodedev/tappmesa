import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { formatCLP, formatCount, formatDay, formatHour } from './format'

// One series per chart: the admin primary (contrast >= 3:1 on white). Marks
// follow the dataviz spec: <= 24px bars, 4px rounded data end, hairline grid.
const SERIES_COLOR = 'var(--color-primary)'
const GRID_COLOR = '#e5e7eb'
const AXIS_TICK = { fontSize: 12, fill: '#6b7280' }

const ChartTooltip = ({ active, payload, label, formatLabel, formatValue, valueLabel }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-gray-900">{formatLabel(label)}</p>
      <p className="text-gray-600">
        {valueLabel}: <span className="font-semibold text-gray-900 tabular-nums">{formatValue(payload[0].value)}</span>
      </p>
    </div>
  )
}

const DataTable = ({ caption, columns, rows }) => (
  <details className="mt-3 text-sm">
    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">Ver datos</summary>
    <table className="mt-2 w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-gray-200 text-xs text-gray-500">
          {columns.map((c) => (
            <th key={c.key} scope="col" className={`py-1 font-medium ${c.numeric ? 'text-right' : ''}`}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-gray-100">
            {columns.map((c) => (
              <td key={c.key} className={`py-1 text-gray-900 ${c.numeric ? 'text-right tabular-nums' : ''}`}>
                {c.format(row[c.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </details>
)

const ChartCard = ({ title, description, children }) => (
  <section aria-label={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-xs text-gray-500">{description}</p>
    {children}
  </section>
)

export const DailySalesChart = ({ daily }) => (
  <ChartCard title="Ventas por día" description="Pedidos entregados, hora de Chile">
    <div className="mt-3 h-56" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={daily} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis dataKey="date" tickFormatter={formatDay} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} minTickGap={16} />
          <YAxis tickFormatter={formatCLP} tick={AXIS_TICK} tickLine={false} axisLine={false} width={84} />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            content={<ChartTooltip formatLabel={formatDay} formatValue={formatCLP} valueLabel="Ventas" />}
          />
          <Bar dataKey="sales" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <DataTable
      caption="Ventas por día"
      rows={daily}
      columns={[
        { key: 'date', label: 'Día', format: formatDay },
        { key: 'orders', label: 'Pedidos', format: formatCount, numeric: true },
        { key: 'sales', label: 'Ventas', format: formatCLP, numeric: true },
      ]}
    />
  </ChartCard>
)

export const HourlyOrdersChart = ({ hourly }) => (
  <ChartCard title="Flujo por hora" description="Pedidos entregados según la hora en que se hicieron">
    <div className="mt-3 h-56" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={hourly} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID_COLOR} />
          <XAxis dataKey="hour" tickFormatter={formatHour} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} interval={2} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            content={<ChartTooltip formatLabel={formatHour} formatValue={formatCount} valueLabel="Pedidos" />}
          />
          <Bar dataKey="orders" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    <DataTable
      caption="Pedidos por hora"
      rows={hourly}
      columns={[
        { key: 'hour', label: 'Hora', format: formatHour },
        { key: 'orders', label: 'Pedidos', format: formatCount, numeric: true },
        { key: 'sales', label: 'Ventas', format: formatCLP, numeric: true },
      ]}
    />
  </ChartCard>
)
