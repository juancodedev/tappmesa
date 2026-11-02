import { useEffect, useId, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useWaiterCalls } from '../../hooks/useWaiterCalls'
import WaiterCallsList from './WaiterCallsList'
import { useResolveWaiterCall } from './useResolveWaiterCall'

const pendingLabel = (count) => (count === 1 ? '1 pendiente' : `${count} pendientes`)

// Admin header entry point (call-waiter S8, assumption A4): visible on every
// admin page so the admin can direct staff to the table.
const WaiterCallsBellInner = ({ tenantId }) => {
  const panelId = useId()
  const wrapperRef = useRef(null)
  const [open, setOpen] = useState(false)
  const { calls, now, resolve } = useWaiterCalls(tenantId)
  const { resolvingId, message, handleResolve } = useResolveWaiterCall(resolve)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Llamados de mesa: ${pendingLabel(calls.length)}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-100 hover:text-primary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {calls.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white"
          >
            {calls.length}
          </span>
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {pendingLabel(calls.length)}
      </span>
      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
        >
          <p className="text-sm font-semibold text-gray-900">Llamados de mesa</p>
          <WaiterCallsList calls={calls} now={now} onResolve={handleResolve} resolvingId={resolvingId} />
          <p role="status" className="text-sm text-gray-600">
            {message}
          </p>
        </div>
      )}
    </div>
  )
}

const WaiterCallsBell = ({ tenantId }) => {
  if (!tenantId) return null
  return <WaiterCallsBellInner tenantId={tenantId} />
}

export default WaiterCallsBell
