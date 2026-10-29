import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// SEC-007: static contract of the post-lockdown hardening. The runtime proof
// (Postgres restored from the production schema, anon/authenticated probes)
// is recorded in the PR.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('harden-anon-grants.sql')
const rollback = read('rollback-harden-anon-grants.sql')
const placeOrder = read('server-order-functions.sql')

describe('database/harden-anon-grants.sql (SEC-007)', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('enforces RLS on tenants and removes anon writes', () => {
    expect(sql).toMatch(/ALTER TABLE public\.tenants ENABLE ROW LEVEL SECURITY;/)
    expect(sql).toMatch(/REVOKE INSERT, UPDATE, DELETE, TRUNCATE[^;]*ON public\.tenants FROM anon;/)
  })

  it('drops the legacy insecure password backup', () => {
    expect(sql).toMatch(/DROP TABLE IF EXISTS public\.admin_users_backup_insecure;/)
  })

  it('locks user_migration_status and restricts subscription_plans writes to super admins', () => {
    expect(sql).toMatch(/user_migration_status ENABLE ROW LEVEL SECURITY;/)
    expect(sql).toMatch(/REVOKE ALL ON public\.user_migration_status FROM anon, authenticated;/)
    expect(sql).toMatch(/subscription_plans ENABLE ROW LEVEL SECURITY;/)
    expect(sql).toMatch(/USING \(app_is_super_admin\(\)\)\s+WITH CHECK \(app_is_super_admin\(\)\)/)
  })

  it('keeps the anon reservation grants required by gate A8_anon_menu_grants', () => {
    const reservations = sql.match(/REVOKE [^;]* ON public\.reservations FROM anon;/)[0]
    expect(reservations).not.toMatch(/\b(SELECT|INSERT|UPDATE)\b/)
  })

  it('revokes tappmesa_place_order EXECUTE from anon and authenticated', () => {
    const revoke = /REVOKE (ALL|EXECUTE) ON FUNCTION public\.tappmesa_place_order\([^)]*\)\s+FROM anon, authenticated;/
    expect(sql).toMatch(revoke)
    expect(placeOrder).toMatch(revoke)
  })

  it('ships a rollback that restores RLS state and grants', () => {
    expect(rollback).toMatch(/tenants DISABLE ROW LEVEL SECURITY;/)
    expect(rollback).toMatch(/DROP POLICY IF EXISTS subscription_plans_super_admin/)
    expect(rollback).toMatch(/GRANT EXECUTE ON FUNCTION public\.tappmesa_place_order/)
  })
})
