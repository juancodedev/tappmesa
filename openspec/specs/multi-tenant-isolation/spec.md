# Spec: Multi-Tenant Data Isolation

## Domain

Multi-tenant data isolation — Supabase query-level tenant scoping for custom auth (no auth.uid()).

## Purpose

Multi-tenant SaaS with custom bcrypt auth cannot rely on `auth.uid()` in RLS, so application-level `tenant_id` filters MUST be explicit. This spec covers 6 independent fixes: adding missing `tenant_id` filters to 5 Supabase mutations and removing one data-leaking debug query.

## Requirements

### R1: KitchenDashboard.updateOrderStatus MUST scope by tenant_id

The `updateOrderStatus` function in KitchenDashboard SHALL add `.eq('tenant_id', tenant.id)` to the Supabase update call, using the `tenant` prop already received by the component.

#### Scenario: Order update scoped to current tenant

- GIVEN a kitchen user with `tenant.id = "A"`
- WHEN they call `updateOrderStatus("order-1", "preparing")`
- THEN the update SHALL include `.eq('tenant_id', "A")`
- AND only orders belonging to tenant A SHALL be updated

#### Scenario: Cross-tenant update hits zero rows

- GIVEN a user of tenant A
- WHEN they attempt to update an order belonging to tenant B
- THEN the query SHALL return 0 matched rows
- AND the catch block SHALL display an error

### R2: getCustomerHistory MUST accept and filter by tenantId

`customerService.getCustomerHistory` SHALL accept a `tenantId` second parameter and add `.eq('tenant_id', tenantId)` to the Supabase query.

#### Scenario: History filtered by tenant

- GIVEN a customer with entries in tenants A and B
- WHEN an admin of tenant A calls `getCustomerHistory("cust-1", "A")`
- THEN the query SHALL include `.eq('tenant_id', "A")`
- AND only tenant A entries SHALL be returned

#### Scenario: Cross-tenant data excluded

- GIVEN the same query for tenant A
- THEN entries belonging to tenant B SHALL NOT appear in results

### R3: TenantContext MUST NOT dump all tenants on failure

The debug fallback `supabase.from('tenants').select('subdomain, name').eq('is_active', true)` in the `loadTenant` catch block SHALL be removed entirely.

#### Scenario: Unknown subdomain fails silently (no leak)

- GIVEN a visitor accesses `nonexistent.localhost:5173`
- WHEN `loadTenant` fails to resolve the subdomain
- THEN the catch branch SHALL throw the error WITHOUT querying all tenants
- AND no tenant list SHALL be logged or returned

### R4: stock_inventory.update MUST scope by tenant_id

`handleEdit` in CompleteStockManager SHALL add `.eq('tenant_id', currentTenant.id)` to the `stock_inventory.update()` call.

#### Scenario: Inventory edit scoped to own tenant

- GIVEN an admin with `currentTenant.id = "A"`
- WHEN they edit a stock item via `handleEdit`
- THEN the update SHALL include `.eq('tenant_id', "A")`
- AND only items belonging to tenant A SHALL be updated

#### Scenario: Cross-tenant edit blocked

- GIVEN an admin of tenant A
- WHEN they edit an item belonging to tenant B
- THEN the update SHALL affect 0 rows

### R5: stock_alerts.resolveAlert MUST scope by tenant_id

`resolveAlert` in CompleteStockManager SHALL add `.eq('tenant_id', currentTenant.id)` to the `stock_alerts.update()` call.

#### Scenario: Alert resolution scoped to own tenant

- GIVEN an admin with `currentTenant.id = "A"`
- WHEN they call `resolveAlert("alert-1")`
- THEN the update SHALL include `.eq('tenant_id', "A")`
- AND only alerts belonging to tenant A SHALL be resolved

#### Scenario: Cross-tenant alert blocked

- GIVEN an admin of tenant A
- WHEN they attempt to resolve an alert belonging to tenant B
- THEN the update SHALL affect 0 rows

### R6: reservationService MUST be exported with three methods

`src/lib/supabase.js` SHALL export `reservationService` providing `getTableAvailability`, `createReservation`, and `getReservations` matching the interface that `ReservationsContext` imports. Each method SHALL scope queries by `tenant_id`.

#### Scenario: Import succeeds without error

- GIVEN `ReservationsContext.jsx` imports `{ reservationService }` from `../../lib/supabase`
- WHEN the app loads
- THEN the import SHALL succeed
- AND all three methods SHALL be callable functions

#### Scenario: getTableAvailability returns tenant-scoped tables

- GIVEN a call to `getTableAvailability(tenantId, date, time)`
- WHEN the tenant has available tables
- THEN it SHALL return `{ success: true, availableTables }`
- AND the query SHALL filter by `.eq('tenant_id', tenantId)`

#### Scenario: createReservation inserts with tenant_id

- GIVEN `createReservation({ tenantId, customerName, date, time, ... })`
- WHEN called with valid data
- THEN it SHALL insert into `reservations` with `tenant_id`
- AND return `{ success: true, reservation }`

#### Scenario: getReservations returns tenant-scoped reservations

- GIVEN `getReservations(tenantId, date)`
- WHEN called with a valid tenantId
- THEN it SHALL query `reservations` filtered by `tenant_id`
- AND return `{ success: true, reservations }`

## Success Criteria

- [ ] KitchenDashboard order status updates scoped to current tenant
- [ ] getCustomerHistory filters by tenant_id
- [ ] TenantContext no longer queries all tenants on subdomain failure
- [ ] CompleteStockManager edits scoped to current tenant
- [ ] CompleteStockManager alert resolutions scoped to current tenant
- [ ] ReservationsContext loads without import error
- [ ] All existing tests pass
