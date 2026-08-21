import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// C3 (JD round 1): el índice único sobre orders.order_number NO puede crearse
// sobre datos legacy: el order_number histórico usa contadores diarios por
// tenant (YYMMDD-001) + fallback aleatorio → duplicados garantizados entre
// productos/temperaturas. La migración debe RECONCILIAR los duplicados ANTES
// de crear el índice para que `prisma migrate deploy` no falle en prod.
// El contrato estático se valida acá; la prueba runtime (postgres real con
// duplicados legacy) vive en el reporte de apply (C3 proof).

const sqlPath = path.resolve(process.cwd(), 'database/add-idempotency-capability-columns.sql')
const sql = readFileSync(sqlPath, 'utf8')

describe('database/add-idempotency-capability-columns.sql (C3)', () => {
  it('reconciles legacy duplicate order_numbers BEFORE creating the unique index', () => {
    expect(sql).toMatch(/row_number\(\)\s*OVER\s*\(\s*PARTITION BY order_number/i)

    // El UPDATE de reconciliación aparece ANTES del create del índice único.
    const updatePos = sql.indexOf('UPDATE public.orders')
    const indexPos = sql.indexOf('orders_order_number_key')
    expect(updatePos).toBeGreaterThanOrEqual(0)
    expect(indexPos).toBeGreaterThan(updatePos)

    // Sufijo determinístico derivado del id de fila: dato preservado, único.
    expect(sql).toMatch(/order_number \|\| '-' \|\|/)
    expect(sql).toMatch(/left\(replace\(o\.id::text, '-'/i)
  })

  it('only reconciles the duplicated rows (rn > 1), leaving unique numbers untouched', () => {
    expect(sql).toMatch(/rn > 1/)
  })

  it('keeps the three unique indexes (idempotency_key, order_number, capability_token)', () => {
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key/)
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key/)
    expect(sql).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS table_sessions_capability_token_key/)
  })

  it('stays idempotent (ADD COLUMN IF NOT EXISTS / IF NOT EXISTS indexes)', () => {
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS/)
    expect(sql).toMatch(/IF NOT EXISTS/)
  })
})