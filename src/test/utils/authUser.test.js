import { describe, it, expect } from 'vitest'
import { toAuthUser } from '../../utils/authUser'

// The admin screens read user.tenant_id (QR, Dashboard, Analytics, table
// statuses, the admin calls bell). Sign-in and session restore must always
// provide it for tenant users.

describe('toAuthUser', () => {
  it('keeps the tenant_id sent by the API', () => {
    const user = toAuthUser({ id: 'u1', role: 'tenant_admin', tenant_id: 't1' }, { id: 't1', name: 'Luna' })
    expect(user).toEqual({ id: 'u1', role: 'tenant_admin', tenant_id: 't1', tenant: { id: 't1', name: 'Luna' } })
  })

  it('fills tenant_id from the tenant when the API omits it', () => {
    const user = toAuthUser({ id: 'u1', role: 'tenant_admin' }, { id: 't1' })
    expect(user.tenant_id).toBe('t1')
    expect(user.tenant).toEqual({ id: 't1' })
  })

  it('leaves tenant_id null for a super admin without a tenant', () => {
    const user = toAuthUser({ id: 'u2', role: 'super_admin' }, null)
    expect(user.tenant_id).toBeNull()
    expect(user.tenant).toBeNull()
  })
})
