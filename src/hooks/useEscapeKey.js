import { useEffect, useRef } from 'react'

// Calls onEscape when the Escape key is pressed while `enabled` is true.
// Used by modal dialogs so keyboard users can always dismiss them.
export const useEscapeKey = (onEscape, enabled = true) => {
  const handlerRef = useRef(onEscape)

  useEffect(() => {
    handlerRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handlerRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled])
}
