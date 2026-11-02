import { Check, Receipt, BellRing } from 'lucide-react'
import { Button } from '../ui/Button'
import { reasonLabel, tableLabel, timerLabel, waitingSeconds, waitingUrgency } from '../../utils/waiterCalls'

const URGENCY_CLASSES = {
  normal: 'text-gray-700',
  warning: 'text-amber-700',
  urgent: 'text-red-700',
}

// Presentational list of pending waiter calls (call-waiter S8). The caller
// passes the calls oldest first.
const WaiterCallsList = ({ calls, now, onResolve, resolvingId = null }) => {
  if (!calls.length) {
    return <p className="py-3 text-sm text-gray-500">No hay llamados pendientes.</p>
  }

  return (
    <ul className="divide-y divide-gray-100">
      {calls.map((call) => {
        const table = tableLabel(call.table?.number)
        const ReasonIcon = call.reason === 'bill' ? Receipt : BellRing
        const seconds = waitingSeconds(call.created_at, now)
        const urgency = waitingUrgency(seconds)
        return (
          <li key={call.id} className="flex items-center justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  call.reason === 'bill' ? 'bg-amber-100 text-amber-800' : 'bg-primary-100 text-primary-800'
                }`}
                aria-hidden="true"
              >
                <ReasonIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900">{table}</p>
                <p className="text-sm text-gray-600">
                  {reasonLabel(call.reason)} · Esperando{' '}
                  <time
                    role="timer"
                    dateTime={call.created_at}
                    data-urgency={urgency}
                    className={`font-semibold tabular-nums ${URGENCY_CLASSES[urgency]}`}
                  >
                    {timerLabel(seconds)}
                  </time>
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="brand"
              onClick={() => onResolve(call.id)}
              disabled={resolvingId === call.id}
              aria-label={`Atendido: ${table}`}
              className="min-h-11 shrink-0 px-3"
            >
              <Check aria-hidden="true" />
              Atendido
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

export default WaiterCallsList
