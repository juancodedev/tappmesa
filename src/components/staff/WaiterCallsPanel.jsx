import { useId } from 'react'
import { BellRing } from 'lucide-react'
import { useWaiterCalls } from '../../hooks/useWaiterCalls'
import WaiterCallsList from './WaiterCallsList'
import { useResolveWaiterCall } from './useResolveWaiterCall'

const pendingLabel = (count) => (count === 1 ? '1 pendiente' : `${count} pendientes`)

// Waiter dashboard section (call-waiter S8, S9).
const WaiterCallsPanel = ({ tenantId }) => {
  const headingId = useId()
  const { calls, now, error, resolve } = useWaiterCalls(tenantId)
  const { resolvingId, message, handleResolve } = useResolveWaiterCall(resolve)

  return (
    <section
      aria-labelledby={headingId}
      className={`mb-6 rounded-lg bg-white p-4 shadow-sm ${calls.length ? 'ring-2 ring-amber-400' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <BellRing className="h-5 w-5 text-amber-600" aria-hidden="true" />
          Llamados de mesa
        </h2>
        <span aria-live="polite" className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
          {pendingLabel(calls.length)}
        </span>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          No pudimos cargar los llamados. Se reintentará automáticamente.
        </p>
      )}
      <WaiterCallsList calls={calls} now={now} onResolve={handleResolve} resolvingId={resolvingId} />
      <p role="status" className="text-sm text-gray-600">
        {message}
      </p>
    </section>
  )
}

export default WaiterCallsPanel
