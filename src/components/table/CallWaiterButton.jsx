import { useCallback, useEffect, useRef, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { api } from '../../services/api'
import Modal from '../ui/Modal'
import { Button } from '../ui/Button'
import { POLL_INTERVAL_MS, WAITER_CALL_REASONS, reasonLabel } from '../../utils/waiterCalls'

// Customer side of the call-waiter feature (odd/tasks/call-waiter.md T4).
// The table-session capability authorizes every request to /api/waiter-calls.

const RESOLVED_MESSAGES = {
  attended: 'Tu llamado fue atendido.',
  expired: 'Nadie respondió a tiempo. Puedes volver a llamar al mesero.',
}

const CallWaiterButton = ({ tenant, tableSession }) => {
  const capability = tableSession?.capability_token
  const enabled = Boolean(capability) && tenant?.waiter_calls_enabled !== false

  const [call, setCallState] = useState(null)
  const callRef = useRef(null)
  const setCall = useCallback((next) => {
    callRef.current = next
    setCallState(next)
  }, [])
  // Bumped by every call/cancel so a status read started earlier cannot
  // overwrite the newer state when it finishes last.
  const versionRef = useRef(0)
  const [message, setMessage] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reason, setReason] = useState('assistance')
  const [busy, setBusy] = useState(false)

  const isPending = call?.status === 'pending'

  // Latest call of the session; reports how a pending call ended.
  const refresh = useCallback(async () => {
    if (!capability) return
    const version = versionRef.current
    try {
      const data = await api.get(`/api/waiter-calls/current?capability=${encodeURIComponent(capability)}`)
      if (version !== versionRef.current) return
      const latest = data?.call || null
      const previous = callRef.current
      if (previous?.status === 'pending' && latest?.id === previous.id && latest.status !== 'pending') {
        setMessage(RESOLVED_MESSAGES[latest.status] || '')
      }
      setCall(latest)
    } catch {
      // Keep the current state; the next poll retries.
    }
  }, [capability, setCall])

  useEffect(() => {
    if (!enabled) return undefined
    const initial = setTimeout(refresh, 0)
    return () => clearTimeout(initial)
  }, [enabled, refresh])

  useEffect(() => {
    if (!enabled || !isPending) return undefined
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, isPending, refresh])

  if (!enabled) return null

  const openDialog = () => {
    setReason('assistance')
    setDialogOpen(true)
  }

  const requestCall = async () => {
    setBusy(true)
    versionRef.current += 1
    try {
      const data = await api.post('/api/waiter-calls', { capability, reason })
      versionRef.current += 1
      setCall(data.call)
      setMessage('')
      setDialogOpen(false)
    } catch (error) {
      setDialogOpen(false)
      setMessage(error?.message || 'No pudimos llamar al mesero. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const cancelCall = async () => {
    setBusy(true)
    versionRef.current += 1
    try {
      const data = await api.post(`/api/waiter-calls/${call.id}/cancel`, { capability })
      versionRef.current += 1
      if (data?.cancelled) {
        setCall(data.call)
        setMessage('Llamado cancelado.')
      } else {
        await refresh()
      }
    } catch (error) {
      setMessage(error?.message || 'No pudimos cancelar el llamado. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 text-right">
      {isPending ? (
        <>
          <p role="status" aria-live="polite" className="text-sm font-semibold text-gray-900">
            Mesero en camino
          </p>
          <p className="text-xs text-gray-600">{reasonLabel(call.reason)}</p>
          {message && (
            <p role="alert" className="max-w-56 text-xs text-red-700">
              {message}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={cancelCall}
            disabled={busy}
            className="min-h-11 px-3"
          >
            <X aria-hidden="true" />
            Cancelar llamado
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="brand"
            onClick={openDialog}
            disabled={busy}
            className="min-h-11 px-3"
          >
            <BellRing aria-hidden="true" />
            Llamar al mesero
          </Button>
          <p role="status" aria-live="polite" className="max-w-56 text-xs text-gray-600">
            {message}
          </p>
        </>
      )}

      <Modal
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Llamar al mesero"
        description="Elige el motivo y avisaremos al personal."
        size="sm"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="min-h-11">
              Cancelar
            </Button>
            <Button type="button" variant="brand" onClick={requestCall} disabled={busy} className="min-h-11">
              Llamar
            </Button>
          </>
        }
      >
        <fieldset className="space-y-2 text-left">
          <legend className="sr-only">Motivo del llamado</legend>
          {WAITER_CALL_REASONS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 hover:bg-gray-50"
            >
              <input
                type="radio"
                name="waiter-call-reason"
                value={option.value}
                checked={reason === option.value}
                onChange={() => setReason(option.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm text-gray-900">{option.label}</span>
            </label>
          ))}
        </fieldset>
      </Modal>
    </div>
  )
}

export default CallWaiterButton
