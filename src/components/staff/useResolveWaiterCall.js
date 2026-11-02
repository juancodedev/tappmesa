import { useState } from 'react'

// Resolve handler shared by the staff call lists: the call may already be
// gone (attended by someone else, or expired).
export function useResolveWaiterCall(resolve) {
  const [resolvingId, setResolvingId] = useState(null)
  const [message, setMessage] = useState('')

  const handleResolve = async (callId) => {
    setResolvingId(callId)
    const outcome = await resolve(callId)
    setResolvingId(null)
    if (outcome?.error) setMessage('No pudimos marcar el llamado. Intenta de nuevo.')
    else if (!outcome?.ok) setMessage('Ese llamado ya fue atendido o venció.')
    else setMessage('')
  }

  return { resolvingId, message, handleResolve }
}
