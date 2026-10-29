/* eslint-disable react-refresh/only-export-components -- context file exports the Provider and its context */
import { createContext, useCallback, useRef, useState } from 'react'
import Modal from '../components/ui/Modal'

export const ConfirmContext = createContext(null)

const TONES = {
  default: 'bg-primary hover:opacity-90',
  danger: 'bg-red-600 hover:bg-red-700',
}

// Accessible replacement for window.confirm():
//   if (!(await confirm('¿Eliminar esta mesa?', { confirmLabel: 'Eliminar', tone: 'danger' }))) return
export const ConfirmProvider = ({ children }) => {
  const [request, setRequest] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((message, { title = 'Confirmar acción', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', tone = 'default' } = {}) => {
    resolver.current?.(false)
    return new Promise((resolve) => {
      resolver.current = resolve
      setRequest({ message, title, confirmLabel, cancelLabel, tone })
    })
  }, [])

  const settle = (value) => {
    resolver.current?.(value)
    resolver.current = null
    setRequest(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={!!request}
        onClose={() => settle(false)}
        title={request?.title}
        description={request?.message}
        size="sm"
        bodyClassName="hidden"
        footer={
          <>
            <button
              type="button"
              onClick={() => settle(false)}
              className="touch-target justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {request?.cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => settle(true)}
              className={`touch-target justify-center rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${TONES[request?.tone] || TONES.default}`}
            >
              {request?.confirmLabel}
            </button>
          </>
        }
      />
    </ConfirmContext.Provider>
  )
}
