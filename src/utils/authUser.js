// Shape of the signed-in staff user kept in AuthContext.
// Admin screens read user.tenant_id, so it is always set: from the API when
// it sends it, otherwise from the tenant of the session (null for a super
// admin without a tenant).
export function toAuthUser(admin, tenant) {
  return {
    ...admin,
    tenant_id: admin?.tenant_id ?? tenant?.id ?? null,
    tenant: tenant ?? null,
  }
}
