import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// call-waiter T1: static contract of the waiter_calls migration. The runtime
// proof (Postgres probes for RLS, concurrency, cooldown and expiry) is recorded
// in odd/tasks/call-waiter.md.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('create-waiter-calls.sql')
const rollback = read('rollback-create-waiter-calls.sql')

describe('database/create-waiter-calls.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('adds the per-tenant toggle, enabled by default (S7)', () => {
    expect(sql).toMatch(
      /ALTER TABLE public\.tenants\s+ADD COLUMN IF NOT EXISTS waiter_calls_enabled boolean NOT NULL DEFAULT true;/
    )
  })

  it('creates waiter_calls with the allowed reasons and statuses', () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.waiter_calls/)
    expect(sql).toMatch(/reason IN \('assistance', 'bill', 'other'\)/)
    expect(sql).toMatch(/status IN \('pending', 'attended', 'cancelled', 'expired'\)/)
    expect(sql).toMatch(/expires_at\s+timestamptz NOT NULL DEFAULT \(now\(\) \+ interval '5 minutes'\)/)
  })

  it('keeps at most one pending call per table session (S4)', () => {
    expect(sql).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS waiter_calls_one_pending_per_session\s+ON public\.waiter_calls \(table_session_id\)\s+WHERE status = 'pending';/
    )
  })

  it('gives anon nothing and staff only SELECT plus UPDATE of status (S10)', () => {
    expect(sql).toMatch(/REVOKE ALL ON public\.waiter_calls FROM anon, authenticated;/)
    expect(sql).toMatch(/GRANT SELECT, UPDATE \(status\) ON public\.waiter_calls TO authenticated;/)
    expect(sql).not.toMatch(/GRANT [^;]*ON public\.waiter_calls TO anon/)
    expect(sql).toMatch(/ALTER TABLE public\.waiter_calls ENABLE ROW LEVEL SECURITY;/)
  })

  it('scopes staff policies to tenant and waiter/admin roles, excluding kitchen (S10)', () => {
    expect(sql).toMatch(/app_claim_role\(\) IN \('waiter', 'staff', 'tenant_admin'\)/)
    expect(sql).not.toMatch(/'kitchen'/)
    expect(sql).toMatch(/CREATE POLICY waiter_calls_staff_select ON public\.waiter_calls\s+FOR SELECT TO authenticated/)
    expect(sql).toMatch(/CREATE POLICY waiter_calls_staff_resolve ON public\.waiter_calls\s+FOR UPDATE TO authenticated/)
    expect(sql).toMatch(/WITH CHECK \(public\.app_can_handle_waiter_call\(tenant_id\) AND status = 'attended'\)/)
    // An expired pending call cannot be attended (no cooldown after an expiry, S6).
    expect(sql).toMatch(
      /USING \(public\.app_can_handle_waiter_call\(tenant_id\) AND status = 'pending' AND expires_at > now\(\)\)/
    )
  })

  it('stamps resolution server-side instead of trusting the client', () => {
    expect(sql).toMatch(/CREATE TRIGGER waiter_calls_stamp_resolution/)
    expect(sql).toMatch(/NEW\.resolved_by := /)
  })

  it('exposes the request function to service_role only (S4-S7)', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.tappmesa_request_waiter_call\(/)
    expect(sql).toMatch(/FOR UPDATE;/)
    expect(sql).toMatch(/RAISE EXCEPTION 'WAITER_CALLS_DISABLED'/)
    expect(sql).toMatch(/RAISE EXCEPTION 'WAITER_CALL_COOLDOWN'/)
    expect(sql).toMatch(/interval '60 seconds'/)
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.tappmesa_request_waiter_call\(uuid, text\)\s+FROM PUBLIC, anon, authenticated;/
    )
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.tappmesa_request_waiter_call\(uuid, text\) TO service_role;/)
  })

  it('publishes waiter_calls to Supabase Realtime (S9)', () => {
    expect(sql).toMatch(/ALTER PUBLICATION supabase_realtime ADD TABLE public\.waiter_calls;/)
  })

  it('ships a rollback that removes every object', () => {
    expect(rollback).toMatch(/^BEGIN;$/m)
    expect(rollback).toMatch(/DROP TABLE IF EXISTS public\.waiter_calls;/)
    expect(rollback).toMatch(/DROP FUNCTION IF EXISTS public\.tappmesa_request_waiter_call\(uuid, text\);/)
    expect(rollback).toMatch(/DROP FUNCTION IF EXISTS public\.app_can_handle_waiter_call\(uuid\);/)
    expect(rollback).toMatch(/ALTER TABLE public\.tenants DROP COLUMN IF EXISTS waiter_calls_enabled;/)
  })
})
