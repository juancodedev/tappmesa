const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
const count = new Intl.NumberFormat('es-CL')

export const formatCLP = (value) => clp.format(Number(value) || 0)
export const formatCount = (value) => count.format(Number(value) || 0)
export const formatPercent = (rate) => `${Math.round((Number(rate) || 0) * 100)}%`

/** Relative change against the previous period, e.g. "+12% vs período anterior". */
export const formatChange = (current, previous) => {
  const cur = Number(current) || 0
  const prev = Number(previous) || 0
  if (prev === 0) return cur === 0 ? 'Sin cambio vs período anterior' : 'Sin datos del período anterior'
  const change = Math.round(((cur - prev) / prev) * 100)
  if (change === 0) return 'Sin cambio vs período anterior'
  return `${change > 0 ? '+' : ''}${change}% vs período anterior`
}

/** Change of a rate in percentage points, e.g. "+5 pts vs período anterior". */
export const formatPointsChange = (current, previous) => {
  const points = Math.round(((Number(current) || 0) - (Number(previous) || 0)) * 100)
  if (points === 0) return 'Sin cambio vs período anterior'
  return `${points > 0 ? '+' : ''}${points} pts vs período anterior`
}

const dayLabel = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
/** 'YYYY-MM-DD' -> "29 oct". The date is already a Santiago day, so format it as UTC. */
export const formatDay = (date) => dayLabel.format(new Date(`${date}T00:00:00Z`))

export const formatHour = (hour) => `${String(hour).padStart(2, '0')}:00`
