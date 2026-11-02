import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Static contract of database/create-waiter-call-stats.sql. The runtime proof
// (Postgres lab: metrics, RLS scope, role checks) is in the PR description.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('create-waiter-call-stats.sql')
const rollback = read('rollback-create-waiter-call-stats.sql')

describe('database/create-waiter-call-stats.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('keeps the caller RLS (SECURITY INVOKER) and checks the analytics roles', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.get_waiter_call_stats\(/)
    expect(sql).toMatch(/SECURITY INVOKER/)
    expect(sql).not.toMatch(/SECURITY DEFINER/)
    expect(sql).toMatch(/v_role NOT IN \('tenant_admin', 'super_admin'\)/)
    expect(sql).toMatch(/p_tenant_id IS DISTINCT FROM public\.app_claim_tenant_id\(\)/)
    expect(sql).toMatch(/RAISE EXCEPTION 'invalid_range'/)
  })

  it('measures attention time from creation to resolution and counts unswept pending calls as expired', () => {
    expect(sql).toMatch(/extract\(epoch FROM resolved_at - created_at\)/)
    expect(sql).toMatch(/percentile_cont\(0\.5\)/)
    expect(sql).toMatch(/status = 'pending' AND expires_at <= now\(\)/)
    expect(sql).toMatch(/GROUP BY resolved_by/)
  })

  it('is callable by signed-in staff only, never anon', () => {
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.get_waiter_call_stats\(uuid, timestamptz, timestamptz\) FROM PUBLIC, anon;/
    )
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION public\.get_waiter_call_stats\(uuid, timestamptz, timestamptz\) TO authenticated;/
    )
  })

  it('ships a rollback', () => {
    expect(rollback).toMatch(/DROP FUNCTION IF EXISTS public\.get_waiter_call_stats\(uuid, timestamptz, timestamptz\);/)
    expect(rollback).toMatch(/DROP INDEX IF EXISTS public\.waiter_calls_tenant_created_idx;/)
  })
})
