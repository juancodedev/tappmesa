import { describe, it, expect } from 'vitest'
import { periodRange, localDateString } from '../../utils/analyticsRange'

// Analytics periods are whole local days in America/Santiago, sent to
// get_analytics as a half-open [from, to) range (odd/tasks/analytics-dashboard.md, S4).

const iso = ({ from, to }) => ({ from: from.toISOString(), to: to.toISOString() })

describe('periodRange', () => {
  const now = new Date('2026-10-30T15:00:00Z') // 12:00 in Santiago (UTC-3)

  it('today covers the current local day', () => {
    expect(iso(periodRange('today', now))).toEqual({
      from: '2026-10-30T03:00:00.000Z',
      to: '2026-10-31T03:00:00.000Z',
    })
  })

  it('7d and 30d end tomorrow at local midnight and include today', () => {
    expect(iso(periodRange('7d', now))).toEqual({
      from: '2026-10-24T03:00:00.000Z',
      to: '2026-10-31T03:00:00.000Z',
    })
    expect(iso(periodRange('30d', now))).toEqual({
      from: '2026-10-01T03:00:00.000Z',
      to: '2026-10-31T03:00:00.000Z',
    })
  })

  it('custom is inclusive of both dates', () => {
    expect(iso(periodRange('custom', now, { from: '2026-10-01', to: '2026-10-02' }))).toEqual({
      from: '2026-10-01T03:00:00.000Z',
      to: '2026-10-03T03:00:00.000Z',
    })
  })

  it('starts the day at 01:00 when DST skips midnight (2026-09-06)', () => {
    expect(iso(periodRange('today', new Date('2026-09-06T15:00:00Z')))).toEqual({
      from: '2026-09-06T04:00:00.000Z',
      to: '2026-09-07T03:00:00.000Z',
    })
  })

  it('starts the day at the second midnight when DST ends (2026-04-05)', () => {
    expect(iso(periodRange('today', new Date('2026-04-05T15:00:00Z')))).toEqual({
      from: '2026-04-05T04:00:00.000Z',
      to: '2026-04-06T04:00:00.000Z',
    })
  })

  it('rejects an unknown period and an inverted custom range', () => {
    expect(() => periodRange('year', now)).toThrow('Unknown period')
    expect(() => periodRange('custom', now, { from: '2026-10-05', to: '2026-10-01' })).toThrow('Invalid range')
  })
})

describe('localDateString', () => {
  it('uses the Santiago calendar day, not UTC', () => {
    expect(localDateString(new Date('2026-10-31T02:30:00Z'))).toBe('2026-10-30')
  })
})
