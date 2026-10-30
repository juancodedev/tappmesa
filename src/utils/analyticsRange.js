// Analytics periods are whole local days in America/Santiago, sent to
// get_analytics (database/analytics-functions.sql) as a half-open [from, to).

export const ANALYTICS_TIME_ZONE = 'America/Santiago'

const DAY_MS = 24 * 60 * 60 * 1000
const PERIOD_DAYS = { today: 1, '7d': 7, '30d': 30 }

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const offsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIME_ZONE,
  timeZoneName: 'longOffset',
})

/** 'YYYY-MM-DD' of the Santiago calendar day that contains `instant`. */
export const localDateString = (instant) => dateFormatter.format(instant)

/** Santiago UTC offset in minutes at `instant` (e.g. -180). */
const offsetMinutes = (instant) => {
  const name = offsetFormatter.formatToParts(instant).find((p) => p.type === 'timeZoneName').value
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/** First instant of the Santiago day `date` ('YYYY-MM-DD'), DST-aware. */
const startOfLocalDay = (date) => {
  const utcMidnight = Date.parse(`${date}T00:00:00Z`)
  // Two passes: the offset at noon guesses the day's offset; the offset at that
  // guess settles days whose midnight is skipped (DST start) or repeated (DST end).
  const guess = utcMidnight - offsetMinutes(new Date(utcMidnight + DAY_MS / 2)) * 60000
  return new Date(utcMidnight - offsetMinutes(new Date(guess)) * 60000)
}

const addDays = (date, days) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10)

/**
 * Range for a period ending today: 'today', '7d', '30d', or 'custom' with
 * { from, to } dates, both included.
 */
export const periodRange = (period, now = new Date(), custom = {}) => {
  if (period === 'custom') {
    if (!custom.from || !custom.to || custom.from > custom.to) throw new Error('Invalid range')
    return { from: startOfLocalDay(custom.from), to: startOfLocalDay(addDays(custom.to, 1)) }
  }
  const days = PERIOD_DAYS[period]
  if (!days) throw new Error(`Unknown period: ${period}`)
  const today = localDateString(now)
  return { from: startOfLocalDay(addDays(today, 1 - days)), to: startOfLocalDay(addDays(today, 1)) }
}
