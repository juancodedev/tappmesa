// Shared constants of the call-waiter feature (customer button and staff lists).

// How often the customer view checks whether a pending call was resolved.
export const POLL_INTERVAL_MS = 10 * 1000

export const WAITER_CALL_REASONS = [
  { value: 'assistance', label: 'Necesito ayuda' },
  { value: 'bill', label: 'Pedir la cuenta' },
  { value: 'other', label: 'Otro motivo' },
]

// Table numbers are free text ("4", "Terraza 2"): prefix only bare numbers.
export const tableLabel = (number) => {
  if (number === null || number === undefined || number === '') return 'Mesa sin número'
  return /^\d+$/.test(String(number)) ? `Mesa ${number}` : String(number)
}

export const waitingSeconds = (createdAt, now) =>
  Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000))

// Live waiting timer as mm:ss (pending calls expire after 5 minutes).
export const timerLabel = (seconds) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

// normal under 2 minutes, warning from 2, urgent from 4 (expiry is at 5).
export const waitingUrgency = (seconds) => {
  if (seconds >= 240) return 'urgent'
  if (seconds >= 120) return 'warning'
  return 'normal'
}

export const reasonLabel = (value) =>
  WAITER_CALL_REASONS.find((reason) => reason.value === value)?.label || 'Necesito ayuda'
