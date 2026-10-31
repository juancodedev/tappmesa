// Staff roles and what each can do. /api/admin/users and the JWT use
// `waiter` and `kitchen`; `staff` and `cocina` are older names kept so
// existing users keep their access.
export const WAITER_ROLES = ['waiter', 'staff']
export const KITCHEN_ROLES = ['kitchen', 'cocina']

const WAITER_PERMISSIONS = [
  'orders:read', 'orders:write',
  'reservations:read', 'reservations:write',
  'customers:read',
  'tables:read',
]
const KITCHEN_PERMISSIONS = [
  'orders:read', 'orders:write',
  'tables:read',
]

export const hasStaffPermission = (role, resource, action) => {
  const permission = `${resource}:${action}`
  if (WAITER_ROLES.includes(role)) return WAITER_PERMISSIONS.includes(permission)
  if (KITCHEN_ROLES.includes(role)) return KITCHEN_PERMISSIONS.includes(permission)
  return false
}
