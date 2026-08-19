import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Contrato estático del artefacto SQL (validación en CI sin DB):
// el número de orden debe generarse con CSPRNG (espec RTE-001, D7),
// no con SQL `random()` (pseudo-RNG) — WARNING-3 del verify report.

const sqlPath = path.resolve(process.cwd(), 'database/server-order-functions.sql')
const sql = readFileSync(sqlPath, 'utf8')

describe('database/server-order-functions.sql (task 1.2)', () => {
  it('generates order_number with a CSPRNG, never SQL random() (WARNING-3/RTE-001)', () => {
    const start = sql.indexOf('-- 4) Número de orden')
    const end = sql.indexOf('-- 5) Line items')
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)

    const genBlock = sql.slice(start, end)
    expect(genBlock).toMatch(/gen_random_bytes/)
    expect(genBlock).not.toMatch(/random\(\)/)
  })

  it('keeps the YYMMDD-XXXXXX shape, unique retry ×3 and ON CONFLICT (order_number)', () => {
    expect(sql).toMatch(/to_char\(now\(\), 'YYMMDD'\) \|\| '-' \|\|/)
    expect(sql).toMatch(/v_attempts >= 3/)
    expect(sql).toMatch(/ORDER_NUMBER_EXHAUSTED/)
    expect(sql).toMatch(/ON CONFLICT \(order_number\) DO NOTHING/)
  })

  it('requires pgcrypto availability (CREATE EXTENSION IF NOT EXISTS pgcrypto)', () => {
    expect(sql).toMatch(/CREATE EXTENSION IF NOT EXISTS pgcrypto/)
  })
})