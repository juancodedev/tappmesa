# Proposal: fix-supabase-critical-filters

## Intent

Multi-tenant SaaS without Supabase Auth (custom bcrypt auth) means RLS policies can't use `auth.uid()` for tenant isolation. Five direct Supabase mutations lack `tenant_id` filters, allowing cross-tenant writes. One debug query leaks all tenant names. One broken import crashes reservations.

## Scope

### In Scope
1. **KitchenDashboard.updateOrderStatus** — add `.eq('tenant_id', tenant.id)` to local supabase call
2. **customerService.getCustomerHistory** — add `tenantId` param + `.eq('tenant_id', tenantId)`
3. **TenantContext debug query** — remove the "show all tenants" fallback query
4. **CompleteStockManager.handleEdit** — add `.eq('tenant_id', currentTenant.id)` to stock_inventory.update
5. **CompleteStockManager.resolveAlert** — add `.eq('tenant_id', currentTenant.id)` to stock_alerts.update
6. **supabase.js reservationService** — export `reservationService` with `getTableAvailability`, `createReservation`, `getReservations` methods

### Out of Scope
- OrdersManager.jsx — already has `.eq('tenant_id', tenantId)` ✓
- RLS policy rewrites — auth model unchanged
- Tests for reservationService (stub only)

## Capabilities

### New Capabilities
- `stock-management`: Adds tenant-scoped writes to inventory/alerts
- `customer-history`: Adds tenant-scoped customer history queries
- `reservations-management`: Provides the reservation service stub

### Modified Capabilities
- None — this is a security/hygiene patch, no spec-level behavior change

## Approach

Each fix is an isolated 1-3 line change: add `.eq('tenant_id', ...)` filter or (for debug query) remove the offending block. `reservationService` gets a minimal export in `supabase.js` implementing the 3 methods ReservationsContext expects.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/kitchen/KitchenDashboard.jsx:92-109` | Modified | Add tenant filter to local updateOrderStatus |
| `src/lib/supabase.js:558-581` | Modified | Add tenantId param + filter to getCustomerHistory |
| `src/lib/supabase.js:end` | Modified | Add reservationService export |
| `src/context/TenantContext.jsx:256-261` | Removed | Delete debug query |
| `src/components/admin/CompleteStockManager.jsx:233-247` | Modified | Add tenant filter to handleEdit |
| `src/components/admin/CompleteStockManager.jsx:297-300` | Modified | Add tenant filter to resolveAlert |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| getCustomerHistory callers break (new param) | Low | All callers pass tenantId already; verify after fix |
| reservationService stub missing edge methods | Low | Only 3 methods used in ReservationsContext; doc what's missing |
| KitchenDashboard order update silently fails | Low | `select()` or check error; mutation scoped correctly |

## Rollback Plan

Revert the commit per file. Each change is independent — can revert one without affecting others. Test KitchenDashboard order status flow after rollback.

## Dependencies

None.

## Success Criteria

- [ ] KitchenDashboard updates order status scoped to current tenant
- [ ] getCustomerHistory filters by tenant_id
- [ ] TenantContext no longer queries all tenants on subdomain failure
- [ ] CompleteStockManager edits and alert resolutions scoped to current tenant
- [ ] ReservationsContext loads without import error
- [ ] All existing tests pass
