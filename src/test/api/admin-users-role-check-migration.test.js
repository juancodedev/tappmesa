import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Prod 2026-10-31: POST /api/admin/users returned 500 for a Cocina user.
// admin_users_role_check only allowed super_admin, tenant_admin, staff and
// waiter, while the panel and the API create 'kitchen'. Static contract here;
// the runtime check against production is recorded in the PR.

const read = (file) => readFileSync(path.resolve(process.cwd(), 'database', file), 'utf8')
const sql = read('fix-admin-users-role-check.sql')
const rollback = read('rollback-fix-admin-users-role-check.sql')
const ROLES = "('super_admin', 'tenant_admin', 'staff', 'waiter', 'kitchen')"

describe('database/fix-admin-users-role-check.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('lets admin_users store the kitchen role', () => {
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS admin_users_role_check;')
    expect(sql).toContain(`ADD CONSTRAINT admin_users_role_check CHECK (role IN ${ROLES});`)
  })

  it('keeps is_valid_role in sync with the constraint', () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION public\.is_valid_role\(role_name TEXT\)/)
    expect(sql).toContain(`RETURN role_name IN ${ROLES};`)
  })

  it('has a rollback that restores the previous role list', () => {
    expect(rollback).toContain("CHECK (role IN ('super_admin', 'tenant_admin', 'staff', 'waiter'));")
  })
})
