import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// Brand fallbacks (odd/tasks/text-contrast.md, T4): when a tenant has no
// colors, the menu, cart and settings fell back to red/orange (#dc2626,
// #f97316), outside the coffee palette in src/index.css.

const SRC = path.resolve(process.cwd(), 'src')
const read = (file) => readFileSync(path.join(SRC, file), 'utf8')
const token = (name) => read('index.css').match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))[1]

const sourceFiles = (dir = SRC) => readdirSync(dir).flatMap((entry) => {
  const full = path.join(dir, entry)
  if (statSync(full).isDirectory()) return entry === 'test' ? [] : sourceFiles(full)
  return /\.jsx?$/.test(entry) ? [path.relative(SRC, full)] : []
})

// S6: user-chosen table status colors and the Recharts chart chrome.
const HEX_ALLOWED = ['components/admin/TableStatusesManager.jsx', 'components/admin/analytics/AnalyticsCharts.jsx', 'utils/brandColors.js']
// S3: gray-400 on the dark landing footer (6.99:1 on gray-900).
const GRAY_400_ALLOWED = ['components/Landing/v2/Footer.jsx']

describe('brand fallback colors', async () => {
  const { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } = await import('../../utils/brandColors')

  it('match the theme palette', () => {
    expect(DEFAULT_PRIMARY_COLOR).toBe(token('primary-500'))
    expect(DEFAULT_SECONDARY_COLOR).toBe(token('secondary-500'))
  })

  it.each([
    'components/menu/MenuCard.jsx',
    'components/cart/FloatingCartButton.jsx',
    'components/admin/Settings.jsx',
  ])('%s uses the shared fallbacks', (file) => {
    const source = read(file)
    expect(source).toMatch(/from ['"].*utils\/brandColors['"]/)
    expect(source).not.toMatch(/#dc2626|#f97316/i)
  })
})

describe('source guard', () => {
  it('keeps hex colors out of components except the documented exceptions', () => {
    const offenders = sourceFiles()
      .filter((file) => !HEX_ALLOWED.includes(file))
      .filter((file) => /['"`]#[0-9a-fA-F]{3,8}['"`]/.test(read(file)))
    expect(offenders).toEqual([])
  })

  it('keeps low-contrast gray-400 text off light surfaces', () => {
    const offenders = sourceFiles()
      .filter((file) => !GRAY_400_ALLOWED.includes(file))
      .filter((file) => /(^|[^:\w-])text-gray-400\b/.test(read(file)))
    expect(offenders).toEqual([])
  })
})
