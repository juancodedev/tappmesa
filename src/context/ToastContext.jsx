/* eslint-disable react-refresh/only-export-components -- context file exports the Provider and its context */
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

export const ToastContext = createContext(null)

const DURATION = { success: 4000, error: 6000 }

const STYLES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
}

const ToastItem = ({ toast, onDismiss }) => {
  const Icon = toast.kind === 'success' ? CheckCircle : AlertTriangle

  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-lg ${STYLES[toast.kind]}`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-sm whitespace-pre-line">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="touch-target -m-2 justify-center rounded-md opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

// Non-blocking replacement for window.alert(): toast.success(msg) / toast.error(msg).
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())
  const nextId = useRef(0)

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((kind, message) => {
    const id = ++nextId.current
    setToasts((current) => [...current, { id, kind, message: String(message ?? '') }])
    timers.current.set(id, setTimeout(() => dismiss(id), DURATION[kind]))
  }, [dismiss])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // Stable identity so components can list `toast` in effect dependencies.
  const toast = useMemo(() => ({
    success: (message) => show('success', message),
    error: (message) => show('error', message),
  }), [show])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:right-4 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} className="w-full max-w-sm">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
