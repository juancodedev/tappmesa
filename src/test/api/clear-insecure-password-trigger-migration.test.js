import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Prod 2026-10-31: PUT /api/admin/users/:id returned 500 when the password
// changed. The AFTER UPDATE trigger clear_insecure_password inserts an audit
// row with a `notes` column that admin_audit_logs does not have (42703), which
// aborts the whole UPDATE. Static contract here; the runtime check against
// production is recorded in the PR.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('fix-clear-insecure-password-trigger.sql')
const rollback = read('rollback-fix-clear-insecure-password-trigger.sql')
const original = read('migrate-to-secure-auth.sql')

describe('database/fix-clear-insecure-password-trigger.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('replaces the trigger function without the missing notes column', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.clear_insecure_password\(\)/)
    expect(sql).toMatch(/INSERT INTO admin_audit_logs \(user_id, tenant_id, action, resource, resource_id, new_values\)/)
    expect(sql).not.toMatch(/\bnotes\b/)
    expect(sql).toContain('SET search_path = public, pg_temp')
  })

  it('keeps migrate-to-secure-auth.sql in sync so a fresh install does not bring the bug back', () => {
    const fn = original.match(/CREATE OR REPLACE FUNCTION clear_insecure_password\(\)[\s\S]*?\$\$ LANGUAGE plpgsql;/)[0]
    expect(fn).not.toMatch(/\bnotes\b/)
  })

  it('has a rollback that restores the previous function', () => {
    expect(rollback).toMatch(/CREATE OR REPLACE FUNCTION public\.clear_insecure_password\(\)/)
  })
})
