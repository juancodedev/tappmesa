import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Prod 2026-10-31: marking an order delivered/completed failed with 42P10
// ("there is no unique or exclusion constraint matching the ON CONFLICT
// specification"). The orders trigger upserts customers ON CONFLICT (phone),
// but customers had no unique key at all: the (tenant_id, phone) unique from
// prisma/schema.prisma was never applied. Static contract here; the runtime
// proof (rolled-back transaction in production) is recorded in the PR.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('fix-customer-stats-on-conflict.sql')
const rollback = read('rollback-fix-customer-stats-on-conflict.sql')
const functions = read('functions.sql')

describe('database/fix-customer-stats-on-conflict.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('adds the per-tenant unique key on customers phone', () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_phone_key\s+ON public\.customers \(tenant_id, phone\);/,
    )
  })

  it('upserts customers on (tenant_id, phone) in the orders trigger', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.update_customer_stats_after_order\(\)/)
    expect(sql).toMatch(/ON CONFLICT \(tenant_id, phone\)/)
    expect(sql).not.toMatch(/ON CONFLICT \(phone\)/)
  })

  it('keeps functions.sql in sync so a fresh install does not bring the bug back', () => {
    expect(functions).toMatch(/ON CONFLICT \(tenant_id, phone\)/)
    expect(functions).not.toMatch(/ON CONFLICT \(phone\)/)
  })

  it('has a rollback that drops the unique key', () => {
    expect(rollback).toMatch(/DROP INDEX IF EXISTS public\.customers_tenant_phone_key;/)
  })
})
