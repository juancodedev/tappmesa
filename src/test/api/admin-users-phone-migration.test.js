import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// Prod 2026-10-31: POST /api/admin/users still returned 500 after the role
// fix. The users form and api/admin/users.js write `phone`, but admin_users
// in production has no such column (42703 "column admin_users.phone does not
// exist"), so every create and every edit failed. Static contract here.

const read = (file) => readFileSync(path.resolve(process.cwd(), file), 'utf8')
const sql = read('database/add-admin-users-phone.sql')
const rollback = read('database/rollback-add-admin-users-phone.sql')
const api = read('api/admin/users.js')
const prisma = read('prisma/schema.prisma')

describe('database/add-admin-users-phone.sql', () => {
  it('runs in a single transaction', () => {
    expect(sql).toMatch(/^BEGIN;$/m)
    expect(sql).toMatch(/^COMMIT;$/m)
  })

  it('adds a nullable phone column to admin_users', () => {
    expect(sql).toContain('ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR;')
  })

  it('backs the phone the API writes on create and update', () => {
    expect(api).toMatch(/phone: body\.phone \|\| null/)
    expect(api).toMatch(/updateData\.phone = body\.phone/)
  })

  it('keeps the Prisma model in sync', () => {
    const model = prisma.match(/model admin_users \{[\s\S]*?\n\}/)[0]
    expect(model).toMatch(/\n\s+phone\s+String\?\s+@db\.VarChar\n/)
  })

  it('has a rollback that drops the column', () => {
    expect(rollback).toContain('ALTER TABLE public.admin_users DROP COLUMN IF EXISTS phone;')
  })
})
