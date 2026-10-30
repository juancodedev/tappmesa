import { formatCLP, formatCount, formatPercent } from './format'

const Panel = ({ title, children }) => (
  <section aria-label={title} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {children}
  </section>
)

const Empty = () => <p className="mt-3 text-sm text-gray-500">Sin ventas en este período.</p>

const Table = ({ caption, head, children }) => (
  <table className="mt-3 w-full text-left text-sm">
    <caption className="sr-only">{caption}</caption>
    <thead>
      <tr className="border-b border-gray-200 text-xs text-gray-500">
        {head.map(([label, numeric]) => (
          <th key={label} scope="col" className={`py-1 font-medium ${numeric ? 'text-right' : ''}`}>
            {label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
)

const Cell = ({ children, numeric }) => (
  <td className={`py-1.5 text-gray-900 ${numeric ? 'text-right tabular-nums' : ''}`}>{children}</td>
)

export const InProgress = ({ counts }) => (
  <section aria-label="Pedidos en curso" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <h3 className="text-base font-semibold text-gray-900">Pedidos en curso</h3>
    <p className="text-xs text-gray-500">Ahora, sin importar el período</p>
    <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
      {[
        ['Pendientes', counts.pending],
        ['En preparación', counts.preparing],
        ['Listos', counts.ready],
      ].map(([label, value]) => (
        <div key={label} className="rounded-lg bg-gray-50 py-2">
          <dt className="text-xs text-gray-600">{label}</dt>
          <dd className="text-xl font-semibold text-gray-900 tabular-nums">{formatCount(value)}</dd>
        </div>
      ))}
    </dl>
  </section>
)

export const TopProducts = ({ products }) => (
  <Panel title="Productos más vendidos">
    {products.length === 0 ? (
      <Empty />
    ) : (
      <Table caption="Productos más vendidos" head={[['Producto'], ['Unidades', true], ['Ingresos', true]]}>
        {products.map((p, i) => (
          <tr key={p.product_id ?? `deleted-${i}`} className="border-b border-gray-100">
            <Cell>
              {p.name ?? <span className="italic text-gray-500">Producto eliminado</span>}
              {p.category && <span className="block text-xs text-gray-500">{p.category}</span>}
            </Cell>
            <Cell numeric>{formatCount(p.units)}</Cell>
            <Cell numeric>{formatCLP(p.revenue)}</Cell>
          </tr>
        ))}
      </Table>
    )}
  </Panel>
)

export const Categories = ({ categories }) => {
  const total = categories.reduce((sum, c) => sum + Number(c.revenue), 0)
  return (
    <Panel title="Ventas por categoría">
      {categories.length === 0 ? (
        <Empty />
      ) : (
        <ul className="mt-3 space-y-3">
          {categories.map((c, i) => {
            const share = total > 0 ? Number(c.revenue) / total : 0
            return (
              <li key={c.category_id ?? `none-${i}`}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">{c.name ?? 'Sin categoría'}</span>
                  <span className="tabular-nums text-gray-900">
                    {formatCLP(c.revenue)} <span className="text-xs text-gray-500">· {formatPercent(share)}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export const SalesByTable = ({ tables }) => (
  <Panel title="Ventas por mesa">
    {tables.length === 0 ? (
      <Empty />
    ) : (
      <Table caption="Ventas por mesa" head={[['Mesa'], ['Pedidos', true], ['Ventas', true]]}>
        {tables.map((t) => (
          <tr key={t.table_number ?? 'none'} className="border-b border-gray-100">
            <Cell>{t.table_number ? `Mesa ${t.table_number}` : 'Sin mesa'}</Cell>
            <Cell numeric>{formatCount(t.orders)}</Cell>
            <Cell numeric>{formatCLP(t.sales)}</Cell>
          </tr>
        ))}
      </Table>
    )}
  </Panel>
)

export const LocalsRanking = ({ locals }) => (
  <Panel title="Ranking de locales">
    <div className="overflow-x-auto">
      <Table
        caption="Ranking de locales"
        head={[['Local'], ['Ventas', true], ['Pedidos', true], ['Ticket', true], ['Cancelación', true]]}
      >
        {locals.map((l) => (
          <tr key={l.tenant_id} className="border-b border-gray-100">
            <Cell>
              {l.name}
              {!l.is_active && <span className="ml-2 rounded bg-gray-100 px-1.5 text-xs text-gray-600">Inactivo</span>}
            </Cell>
            <Cell numeric>{formatCLP(l.sales)}</Cell>
            <Cell numeric>{formatCount(l.orders)}</Cell>
            <Cell numeric>{formatCLP(l.average_ticket)}</Cell>
            <Cell numeric>{formatPercent(l.cancellation_rate)}</Cell>
          </tr>
        ))}
      </Table>
    </div>
  </Panel>
)
