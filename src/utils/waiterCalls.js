// Shared constants of the call-waiter feature (customer button and staff lists).

// How often the customer view checks whether a pending call was resolved.
export const POLL_INTERVAL_MS = 10 * 1000

export const WAITER_CALL_REASONS = [
  { value: 'assistance', label: 'Necesito ayuda' },
  { value: 'bill', label: 'Pedir la cuenta' },
  { value: 'other', label: 'Otro motivo' },
]

export const reasonLabel = (value) =>
  WAITER_CALL_REASONS.find((reason) => reason.value === value)?.label || 'Necesito ayuda'
