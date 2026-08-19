# Delta Spec: Fix Critical Security Posture

## Context

TappMesa's multi-tenant isolation is structurally broken: the anon key is the only client credential, RLS was applied with contradictory scripts (a transaction-local GUC latch no client sets + committed `USING(true)` policies), and critical write flows (order cancel, user creation, order placement, password reset) run from the browser with no server-side authority. Judgment Day R2 proved the intended interim (anon capability-header scoping) is also unsound (R2-1..R2-5). This change restores isolation fully server-side: **zero anon access to `orders` / `order_items` / `table_sessions` in any release window**; server-minted JWTs (claims validated by PostgREST) make RLS real enforcement for staff/super_admin; customer order/session flows move to transactional server routes; C2/C3/C5/C6 closed. Split annotations: **S1** `server-data-routes`, **S2** `rls-lockdown-flip`, **S3** `route-hardening` (design §11).

Reference specs that must converge: `openspec/specs/multi-tenant-isolation/spec.md` (R1-R6 app-level filters remain as defense-in-depth, MUST NOT regress) and `openspec/specs/infrastructure/spec.md` (CJS/CSP — untouched by this change).

## ADDED Requirements

### Requirement: SEC-001 — Server-minted JWT with claim model

The system MUST mint custom JWTs signed HS256 with the server-only `SUPABASE_JWT_SECRET` (via `jsonwebtoken`, new dependency) carrying claims `{ role: 'authenticated', sub, app_tenant_id: uuid|null, app_role: tenant_admin|staff|waiter|kitchen|super_admin, app_user_id, iat, exp: +3600, iss: 'tappmesa-api' }`. TTL MUST be 60 minutes. `requireAuth` middleware MUST verify the bearer `tappmesa-session` against `admin_sessions` + `admin_users` and produce the claim object. Customers MUST receive NO JWT — the table-session capability is their credential.

**Split: 1 (`server-data-routes`)**

#### Scenario: Staff token minted with correct claims

- GIVEN a valid `tappmesa-session` for a tenant_admin of tenant A
- WHEN `GET/POST /api/auth/token` is called with `Authorization: Bearer <session>`
- THEN the response contains `{ token, expires_at, claims }`
- AND `claims` include `role: 'authenticated'`, `app_tenant_id: 'A'`, `app_role`, `app_user_id`, and `exp - iat = 3600`
- AND the token verifies with `jwt.verify(token, SUPABASE_JWT_SECRET)` and is accepted by PostgREST (pre-lockdown test query)

#### Scenario: Customer flow mints no JWT

- GIVEN an anonymous browser session on the customer menu
- WHEN the customer creates a table session or places an order
- THEN no JWT is minted or stored
- AND only the server route responses (session capability, order result) are returned

### Requirement: SEC-002 — Token delivery and storage

The system MUST keep `tappmesa-session` as the long-lived credential and MUST store the JWT in localStorage key `tappmesa-jwt`, replaced on refresh. `GET /api/auth/session` MUST return `{ session, token }` inline (single round-trip). `GET·POST /api/auth/token` MUST exist as the silent-refresh endpoint for 401 handling. The client MUST refresh the JWT on 401 before clearing the session.

**Split: 1 (`server-data-routes`)**

#### Scenario: Session restore returns token inline

- GIVEN a valid stored `tappmesa-session`
- WHEN `getCurrentSession()` calls `GET /api/auth/session`
- THEN the response includes both session payload and fresh JWT
- AND AuthContext stores the JWT in `tappmesa-jwt` BEFORE setting user state (TenantProvider depends on it)

#### Scenario: 401 triggers silent JWT refresh

- GIVEN a staff request rejected with 401 while `tappmesa-session` is still valid
- WHEN the client receives the 401
- THEN it calls `/api/auth/token` with the bearer session before considering the session dead

### Requirement: SEC-003 — Live-binding JWT attach (setAccessToken)

The system MUST export `let supabase` from `src/lib/supabase.js` and MUST provide `setAccessToken(jwt)` that rebuilds the client with `global.headers: { Authorization: Bearer <jwt> }`. ESM live bindings MUST propagate the swap to all importers with **zero call-site edits for staff/super_admin reads**.

**Split: 1 (`server-data-routes`)**

#### Scenario: Staff reads ride claim-scoped RLS without edits

- GIVEN a staff user signed in with an attached JWT
- WHEN any existing supabase-js read executes (e.g. KitchenDashboard orders query)
- THEN the request carries `Authorization: Bearer <jwt>`
- AND the call shape is unchanged from today

### Requirement: SEC-004 — Zero anon access to order/session tables

The system MUST NOT grant anon access (SELECT/INSERT/UPDATE/DELETE) to `orders`, `order_items`, or `table_sessions` in ANY split, including no anon policies and no anon grants. The table_session uuid MUST never be published by any anon-readable table read; it is only ever returned by server routes.

**Split: all (binding; enforced S2 migration)**

#### Scenario: Anon no-JWT reads 0 rows

- GIVEN an anon supabase-js client with no JWT
- WHEN it queries `orders`, `order_items`, or `table_sessions`
- THEN 0 rows are returned for each table

#### Scenario: Capability never enumerated

- GIVEN an anon client
- WHEN it attempts any read on `table_sessions`
- THEN no session rows or uuids are returned (R2-1 closed)
- AND session create/resume is available only via `POST /api/table-sessions`

### Requirement: SEC-005 — Sequencing rule (S1 before S2)

The migration in S2 MUST NOT be committed until the S1 server routes, schema (unique indexes), and token path are live and verified. Server routes MUST be additive and dormant-safe before the flip.

**Split: 1 → 2 dependency**

#### Scenario: Migration blocked until routes verified

- GIVEN S2 apply day begins
- WHEN the day-of checklist runs
- THEN `POST /api/orders`, `GET /api/orders/my`, `POST /api/orders/:id/cancel`, `POST /api/table-sessions`, and `/api/auth/token` are live and verified
- AND ONLY THEN is `secure-data-access.sql` executed

### Requirement: SEC-006 — CORS-neutral transport (R2-5)

The system MUST NOT introduce any custom request headers. All server routes MUST use standard `Authorization: Bearer` and JSON bodies only; no `x-session-id`, no `setAnonSession`. Capabilities MUST travel in body or query string.

**Split: 1 (`server-data-routes`)**

#### Scenario: No custom headers in any request

- GIVEN the browser preflight check for `POST /api/orders`
- WHEN the OPTIONS/CORS inspection runs
- THEN the request contains no custom headers
- AND the allowed headers are the standard allow-list (`Authorization`, `Content-Type`)

### Requirement: SEC-007 — SUPABASE_JWT_SECRET server-only

The `SUPABASE_JWT_SECRET` MUST be configured in Vercel env and local `.env` only, MUST NOT be prefixed `VITE_`, and MUST NOT appear in any client bundle or client-side source file.

**Split: 1 (`server-data-routes`)**

#### Scenario: Secret absent from client bundle

- GIVEN the production build output
- WHEN searching for `SUPABASE_JWT_SECRET` in client chunks
- THEN the string MUST NOT appear
- AND `.env.local.sample` documents it as server-only

### Requirement: SEC-008 — super_admin preservation

The system MUST preserve the `super_admin` cross-tenant capability via the `app_role = 'super_admin'` OR-branch in RLS policies and via server-validated routes. `app_claim_tenant_id()` MUST return NULL for super_admin without breaking the OR-branch (NULL-safe comparison).

**Split: 1 (routes) + 2 (policies)**

#### Scenario: Super admin reads across tenants

- GIVEN a JWT with `app_role: 'super_admin'` and `app_tenant_id: null`
- WHEN the super admin queries orders of tenants A and B
- THEN rows from both tenants are returned
- AND tenant_admin JWTs return only their own tenant's rows

### Requirement: RTE-001 — POST /api/orders (transactional, idempotent)

The system MUST expose `POST /api/orders` (public, capability-authenticated) executing `tappmesa_place_order` — a plpgsql **INVOKER** function, REVOKE PUBLIC EXECUTE, service-role-only — inside ONE transaction: INSERT orders (`ON CONFLICT (idempotency_key) DO NOTHING`) → order_items → session totals. Prices MUST be read from DB products; totals and 19% IVA MUST be server-computed; `order_number` (`YYMMDD-XXXXXX`, CSPRNG, unique-retry ×3) MUST be server-generated; `idempotency_key` MUST be unique. Input validation: `items[] {product_id: uuid, quantity 1-99, notes ≤500, temperature hot|cold}`, optional `capability`, optional `customer {name?, phone?}`, optional `notes`. Replay MUST return the existing order. Response: `201 {order, duplicate:false}` | `200 {order, duplicate:true}` | `400` validation/unknown product | `429` (30/min/IP).

**Split: 1 (`server-data-routes`)**

#### Scenario: Double-submit creates exactly one order

- GIVEN two concurrent POSTs to `/api/orders` with the same `idempotency_key`
- WHEN both reach the server
- THEN exactly one order row and its order_items exist
- AND the second response is `200 {order, duplicate:true}` referencing the same order

#### Scenario: IVA and totals server-computed

- GIVEN a cart whose client-side total is tampered with
- WHEN `POST /api/orders` executes
- THEN totals and 19% IVA are recomputed from DB product prices
- AND the stored order reflects server-computed values, not client values

#### Scenario: Takeout order (no capability)

- GIVEN `table_session_id: null` (takeout) and no capability
- WHEN `POST /api/orders` executes
- THEN the tenant is resolved server-side from the `Host` subdomain
- AND the order is created with `table_session_id: null`
- AND `400` is returned when no tenant is resolvable

### Requirement: RTE-002 — GET /api/orders/my (own-order read)

The system MUST expose `GET /api/orders/my?capability=…` (public, capability-authenticated; raw uuid accepted dual-mode during flip only) resolving the active session and returning its orders with the embedded `order_items → products` shape (identical to `TableOrdersHistory.jsx:31-46`), newest first. Missing param MUST return `400`; unknown/inactive session MUST return `200 []` (no oracle); rate-limited (`orders/my`).

**Split: 1 (`server-data-routes`)**

#### Scenario: Pollers get the same embedded shape

- GIVEN `TableOrdersHistory` and `CustomerMenuHeader` pollers
- WHEN they call `GET /api/orders/my?capability=…`
- THEN the response shape matches today's embedded read
- AND both pollers are drop-in (no component contract change)

#### Scenario: Unknown capability returns empty, not error

- GIVEN a capability that resolves to no active session
- WHEN `GET /api/orders/my?capability=<unknown>` executes
- THEN the response is `200 []`
- AND no session/order existence oracle is revealed

#### Scenario: Missing parameter rejected

- GIVEN a request without `capability`
- WHEN `GET /api/orders/my` executes
- THEN the response is `400`

### Requirement: RTE-003 — POST /api/orders/:id/cancel (capability-gated)

The system MUST expose `POST /api/orders/:id/cancel` with body `{capability}` (uuid dual-mode during flip) executing `UPDATE orders SET status='cancelled' WHERE id=:id AND table_session_id=<resolved session> AND status='pending'` — server-side session-ownership check, no client-supplied tenant filter (closes C1). Foreign/unknown session MUST affect 0 rows and return `200 {success, cancelled:false}` (no oracle). Rate-limited (`orders`).

**Split: 1 (`server-data-routes`)**

#### Scenario: Own pending order cancelled

- GIVEN an active session capability owning a pending order
- WHEN cancel is posted with that capability
- THEN the order status becomes `cancelled`
- AND the response is `200 {success: true, cancelled: true}`

#### Scenario: Foreign session cancel affects 0 rows

- GIVEN a capability for session X and an order belonging to session Y
- WHEN cancel is posted for the Y-order with the X-capability
- THEN 0 rows are updated
- AND the response is `200 {success: true, cancelled: false}`

### Requirement: RTE-004 — POST /api/table-sessions (create/resume)

The system MUST expose `POST /api/table-sessions` (public) with `{table_id, tenant_id}` verifying the `tables` row server-side (tenant match, `is_active`, `qr_code_expires_at` not passed — mirrors `TenantContext.jsx:120-127`), then resume the active session (`tenant_id, table_id, status='active'`, latest) or INSERT one with server-side `session_code` (`{code}-{ts36}`) and a minted `capability_token` (`ts_` + base64url(HMAC-SHA256(session_uuid, SUPABASE_JWT_SECRET, tag `tappmesa-capability-v1`)), unique index). Responses: `200 {session, resumed}` | `201 {session}` including `capability_token` | `400` table not found/expired | `429` (`table-sessions`).

**Split: 1 (`server-data-routes`)**

#### Scenario: Create returns capability token

- GIVEN a valid active table
- WHEN `POST /api/table-sessions` executes with its `table_id` + `tenant_id`
- THEN a session row is inserted with server-side `session_code` and `capability_token`
- AND the response is `201 {session}` including `capability_token`

#### Scenario: Resume returns existing active session

- GIVEN a table with an existing `status='active'` session
- WHEN `POST /api/table-sessions` executes
- THEN the existing session is returned as `200 {session, resumed: true}`
- AND no duplicate session row is inserted

#### Scenario: Expired QR code rejected

- GIVEN a table whose `qr_code_expires_at` is in the past
- WHEN `POST /api/table-sessions` executes
- THEN the response is `400`
- AND no session is created

### Requirement: RTE-005 — Takeout tenant resolution from Host

The system MUST resolve the tenant for takeout orders (`table_session_id: null`, no capability) from the `Host` header subdomain (`[x]-tappmesa.vercel.app` / `.tappmesa.com` / `.localhost`), returning `400` if unresolvable. The existing cart takeout branch MUST NOT regress.

**Split: 1 (`server-data-routes`)**

#### Scenario: Takeout order lands in the right tenant

- GIVEN a request to a tenant subdomain with no capability and `table_session_id: null`
- WHEN `POST /api/orders` executes
- THEN the order is created under the tenant resolved from `Host`

### Requirement: RTE-006 — Rate limits on public routes

The system MUST rate-limit `auth/token`, `auth/reset-password/confirm`, `auth/reset-password/reset`, `orders`, `orders/my`, `table-sessions`, and `admin/users` (in-memory fallback acceptable; Vercel KV optional).

**Split: 1 (`server-data-routes`)**

#### Scenario: Burst exceeds threshold

- GIVEN a client exceeding the per-IP limit for `orders` (30/min)
- WHEN further requests arrive
- THEN the response is `429` with a retry window

### Requirement: ADM-001 — /api/admin/users (bcrypt, claim-scoped)

The system MUST expose CRUD `/api/admin/users` behind `requireAuth` + role check. Passwords MUST be hashed with bcrypt (12 rounds) server-side; `tenant_id` and `role` MUST come from session claims, never client input (except `super_admin` may set `tenant_id`); `tenant_admin` MUST be restricted to own tenant and a role allowlist excluding `super_admin`; responses MUST strip `password_hash`; duplicate-email check per tenant; audit log rows written. Status: `201/200/204` | `400` validation | `403` role | `409` self-delete | `429`.

**Split: 1 (`server-data-routes`)**

#### Scenario: Created user has bcrypt hash

- GIVEN a UsersManager create request
- WHEN `/api/admin/users` executes
- THEN the stored `password_hash` starts with `$2` (bcrypt)
- AND the response body contains no `password_hash` key

#### Scenario: tenant_admin cannot escalate

- GIVEN a tenant_admin session claim
- WHEN they attempt to create a `super_admin` or a user in another tenant
- THEN the response is `403`

### Requirement: ADM-002 — Reset flow hardening (C2)

The system MUST generate reset tokens server-side only: `crypto.randomBytes(32).toString('hex')`, 24h expiry, previous tokens deleted, inserted via service role. The public `generate_password_reset_token` function MUST be dropped; `password_reset_tokens` MUST have RLS enabled with zero policies. Rate limits MUST apply to confirm/reset.

**Split: 1 (`server-data-routes`)**

#### Scenario: Token minted server-side only

- GIVEN a reset request
- WHEN `handleResetRequest` runs
- THEN a 32-byte CSPRNG token is stored via service role with 24h expiry
- AND no client-visible or publicly callable minting function exists (`pg_proc` shows `generate_password_reset_token` absent)

#### Scenario: Token table closed to clients

- GIVEN any anon or authenticated JWT
- WHEN querying `password_reset_tokens`
- THEN 0 rows are returned (RLS on, zero policies)

### Requirement: C5-001 — Session clear only on 401

`getCurrentSession` (src/lib/supabase.js) MUST clear `tappmesa-session` ONLY when the response status is `401`; network failures and 5xx MUST propagate without clearing storage.

**Split: 1 (`server-data-routes`)**

#### Scenario: Network failure keeps session

- GIVEN a mid-session network kill
- WHEN `getCurrentSession` runs
- THEN localStorage is NOT cleared
- AND the error propagates to the caller

#### Scenario: 401 clears session

- GIVEN an expired/invalid session token
- WHEN `getCurrentSession` receives `401`
- THEN `tappmesa-session` and `tappmesa-jwt` are cleared

### Requirement: RLS-001 — Customer frontend flips to routes

The system MUST redirect customer order/session flows to server routes: `CartContext.placeOrder` → `POST /api/orders` (drop client order_number count and client-trusted totals); `TenantContext.createOrResumeTableSession` → `POST /api/table-sessions` (store `capability_token`); `TableOrdersHistory` poller → `GET /api/orders/my?capability=…` and cancel → `POST /api/orders/:id/cancel`; `CustomerMenuHeader` poller → `GET /api/orders/my?capability=…` (same latest-non-cancelled/delivered filter). No direct supabase-js writes to `orders`/`order_items`/`table_sessions` MAY remain in customer flows.

**Split: 2 (`rls-lockdown-flip`)**

#### Scenario: Place order goes through the route

- GIVEN a customer cart and an active session capability
- WHEN the customer places the order
- THEN one `POST /api/orders` call occurs (no orders/order_items/table_sessions supabase-js calls)

#### Scenario: Cancel flow restored via gated route

- GIVEN `TableOrdersHistory` cancel UI
- WHEN the customer cancels
- THEN `POST /api/orders/:id/cancel` is called with the capability
- AND no unfiltered UPDATE by id remains in the component

### Requirement: RLS-002 — Staff read paths ride claim RLS

The system MUST keep the call shape of staff/super_admin supabase-js reads unchanged and rely on the attached JWT + claim policies: KitchenDashboard, ActiveOrdersPanel, OrdersManager, Dashboard, preBillService, WaiterDashboard, TablesGrid, CreateOrderModal, SuperAdminOrdersManager, SuperAdminTenantsManager, TenantTester (dev).

**Split: 1 enables / 2 verified**

#### Scenario: Staff reads work post-lockdown

- GIVEN a staff JWT for tenant A
- WHEN any listed staff component queries
- THEN own-tenant rows are returned via claim policies
- AND cross-tenant rows are 0

### Requirement: PRO-001 — ProtectedRoute + requireRole on staff routes

The system MUST wrap `/waiter`, `/garzon`, `/kitchen`, `/cocina` with `ProtectedRoute` + `requireRole` enforcing `app_role` (`staff`/`waiter`/`kitchen`; `super_admin` allowed). The client guard is UX-only — real enforcement is server-side claims.

**Split: 3 (`route-hardening`)**

#### Scenario: Unauthenticated staff route redirects

- GIVEN no valid session/JWT
- WHEN navigating to `/kitchen` (or `/waiter`, `/cocina`, `/garzon`)
- THEN the app redirects to login

#### Scenario: Authorized role reaches the route

- GIVEN a JWT with `app_role: 'kitchen'`
- WHEN navigating to `/kitchen`
- THEN the dashboard renders

### Requirement: PRO-002 — Optional split-3 residuals

The system MAY replace `get_top_products` with a route-based rewrite, migrate staff polling to realtime, and improve UX error copy; these MUST NOT be prerequisites for splits 1-2 acceptance.

**Split: 3 (`route-hardening`)**

#### Scenario: Residuals optional

- GIVEN splits 1-2 accepted
- WHEN split 3 ships without polling→realtime or route rewrite
- THEN acceptance still passes (claim-guard from MIG-003 already closes the IDOR)

## MODIFIED Requirements

### Requirement: multi-tenant-isolation — RLS claims become primary enforcement

Multi-tenant isolation enforcement SHALL shift from app-level `.eq('tenant_id', …)` filters alone to RLS claim checks (on `auth.jwt()` claims via `app_claim_tenant_id()` / `app_is_super_admin()`) as the primary control; app-level filters (R1-R6) remain as defense-in-depth and MUST NOT regress. R1 (KitchenDashboard scoping) and R2 (getCustomerHistory) remain mandatory; R3 (no tenant dump), R4/R5 (stock scoping), R6 (reservationService scoping) remain in force unchanged.
(Previously: application-level `tenant_id` filters were the only enforcement mechanism; RLS was latch/`USING(true)`-based and non-functional.)

#### Scenario: June 2026 fixes not regressed

- GIVEN the post-lockdown release
- WHEN KitchenDashboard `updateOrderStatus` and `getCustomerHistory(tenantId)` run
- THEN both still scope by tenant (app-level + RLS claim)
- AND all existing tests pass

## REMOVED Requirements

### Requirement: src/lib/authService.js (dead duplicate)

The file `src/lib/authService.js` MUST be deleted.
(Reason: dead duplicate of `secureAuthDirect.js`-era auth — zero importers verified, superseded by `secureAuthService`/routes; D15.)
(Migration: none — verify no dangling imports.)

### Requirement: src/middleware/tenantResolver.js (dead latch caller)

The file `src/middleware/tenantResolver.js` MUST be deleted.
(Reason: sole caller of the dropped `set_tenant_context` latch function; zero importers; closing the NULL-latch C1 root requires removing it; D12.)
(Migration: none — verify no dangling imports.)

## Deferred Requirements (design §13 — end of program)

**Phase: DEFERRED (after splits 1-3) — MUST NOT be silently dropped; tracked in design §13. Each item requires an explicit follow-up task/PR before the fix program closes.**

### Requirement: DEF-001 — Capability enumeration closure (S-A1)

The system MUST eventually resolve tables server-side by `unique_code` (physical gate) in `POST /api/table-sessions`, MUST bind capability to tenant + session and make it single-use, and MUST kill raw-uuid dual-mode acceptance after the flip.
(Phase: DEFERRED — accepted risk S-A1; re-opens R2-1/R2-3 class until closed.)

#### Scenario: Follow-up closes enumeration

- GIVEN a deferred-program follow-up task
- WHEN an anon submits a guessed `table_id`+`tenant_id`
- THEN no capability is minted unless a physical `unique_code` gate is passed
- AND dual-mode raw-uuid acceptance is removed

### Requirement: DEF-002 — Order route input contract extension (S-A2)

`POST /api/orders` SHOULD eventually accept and persist `estimated_time` / `table_number` (regression vs `CartContext.jsx:204-221`; UIs render estimates).
(Phase: DEFERRED — accepted risk S-A2.)

#### Scenario: Estimates preserved

- GIVEN the deferred follow-up applied
- WHEN an order with `estimated_time` / `table_number` is placed
- THEN the values are persisted and rendered by `TableOrdersHistory` / `CustomerMenuHeader`

### Requirement: DEF-003 — reservations authenticated grants (S-A3)

`reservations` MUST eventually be added to the authenticated claim-grant set so staff reservation reads (`supabase.js:606-694`) work post-flip.
(Phase: DEFERRED — accepted risk S-A3; staff reservation reads break after S2 until closed.)

#### Scenario: Staff reservation reads restored

- GIVEN the deferred follow-up applied
- WHEN a staff user reads reservations
- THEN claim-scoped reservation rows are returned

### Requirement: DEF-004 — getTableAvailability reservation scoping (S-A4)

`getTableAvailability` (supabase.js:620-626) MUST eventually be reconciled with anon `status='confirmed'` scoping to avoid double-booking (it filters `.neq('status','cancelled')`).
(Phase: DEFERRED — accepted risk S-A4.)

#### Scenario: Availability respects confirmed scoping

- GIVEN the deferred follow-up applied
- WHEN availability is computed
- THEN cancelled/confirmed states are handled without double-booking risk

### Requirement: DEF-005 — RLS ENABLE on pre_bills/surveys/tenant_subscriptions (S-B3)

RLS MUST eventually be ENABLEd on `pre_bills`, `surveys`, and `tenant_subscriptions` so the S2 claim grants+policies are not bypassed (RLS-off = cross-tenant read/write).
(Phase: DEFERRED — accepted risk S-B3; the S2 grants exist and ride on this closure.)

#### Scenario: RLS-on verified

- GIVEN the deferred follow-up applied
- WHEN checking `pg_class.relrowsecurity` for the three tables
- THEN RLS is enabled for all three

### Requirement: DEF-006 — SuperAdminTenantsManager admin_users read (S-B4)

`SuperAdminTenantsManager.jsx:114` MUST eventually stop reading `admin_users` client-side (post-flip zero grants make user counts silently 0) — either via an authenticated grant for super_admin claims or a server route.
(Phase: DEFERRED — accepted risk S-B4.)

#### Scenario: User counts not silently zero

- GIVEN the deferred follow-up applied
- WHEN a super admin opens the tenants manager
- THEN user counts reflect real data

### Requirement: DEF-007 — update_customer_stats_after_order ON CONFLICT (S-B5)

`update_customer_stats_after_order` MUST eventually reconcile its `ON CONFLICT (phone)` with Prisma's `@@unique([tenant_id, phone])` (42704 aborts staff UPDATE — pre-existing, keep+verify must handle).
(Phase: DEFERRED — accepted risk S-B5.)

#### Scenario: Staff update no longer aborts

- GIVEN the deferred follow-up applied
- WHEN a staff `CreateOrderModal` update fires the trigger
- THEN no 42704 unique-violation aborts the update

**Also tracked (INFO, decouple later):** D4 capability HMAC keyed on `SUPABASE_JWT_SECRET` (rotation invalidates live capabilities → per-session key or separate capability secret); takeout Host-header tenant resolution (non-browser clients can pollute orders into a tenant — bounded, rate-limited, no read path).

## Non-Goals

- NOT building a full API proxy for all ~48 direct-supabase call sites (staff/super_admin reads stay on supabase-js with claim-scoped RLS).
- NOT migrating auth to Supabase Auth (custom bcrypt + session tokens remain).
- NOT redesigning UX, the IVA model contradiction, or the frontend god-object refactor.
- NOT introducing custom CORS headers (R2-5) — `Authorization` + JSON only.
- NOT exposing a public "is this table-session code valid" check in S1 (`session_code` is display-only; the capability is the credential).
- NOT fixing non-critical audit findings except where the sweep requires it (polling and `alert()` stay).
- NOT writing an automated E2E suite (e2e unavailable per config) — day-of manual flip checklist per design §8.
- NOT fixing the reservations anon PII residual in this change (`status='confirmed'` scoping unchanged; flagged S-A4/DEF-004).

## Acceptance Criteria (per group — design §12 checklist)

- [ ] **SEC**: test token accepted by PostgREST pre-lockdown; claims verified (`exp` 3600, `role: 'authenticated'`); `SUPABASE_JWT_SECRET` absent from client bundle and any `VITE_` var; zero custom headers (R2-5); `super_admin` list/create/switch validated.
- [ ] **RTE**: double-submit (same `idempotency_key`) → exactly 1 order; `order_number` unique; totals = server-computed 19% IVA; takeout works; `GET /api/orders/my` unknown → `200 []`, missing → `400`; cancel foreign session → 0 rows, `cancelled:false`; session create/resume correct; rate limits respond `429`.
- [ ] **ADM**: `password_hash` starts `$2` after UsersManager create; responses lack the key; `generate_password_reset_token` absent from `pg_proc`; `password_reset_tokens` RLS on with zero policies; rate limits on confirm/reset.
- [ ] **C5**: network kill mid-session does NOT clear localStorage; a 401 does (both `tappmesa-session` and `tappmesa-jwt`).
- [ ] **MIG**: `pg_policies` SQL assert — zero policies with bare `true`, `auth.uid()`, or latch fn quals; named inventory absent incl. `tables_{select,insert,update,delete}_authenticated` (all 4), `table_statuses_*_all`, loyalty 7, `*_tenant_*`; DROP-fn targets absent from `pg_proc`; anon matrix 0 rows on orders/order_items/table_sessions/customers/customer_order_history/table_statuses/admin_*/password_reset_tokens; menu reads OK; claim matrix own-tenant rows, cross-tenant 0, super_admin OK; trigger smoke (staff `CreateOrderModal` → `stock_movements` created; service-role order → session totals updated); `add_loyalty_points_on_order`/trigger confirmed dropped; rollback script restores pre-flight snapshot.
- [ ] **RLS**: customer table flow regression-free (menu, session create/resume, place order, "Mis Pedidos" pollers, takeout); `authService.js`/`tenantResolver.js` gone with no dangling imports; June 2026 fixes not regressed; `pnpm test:run` green.
- [ ] **PRO**: unauth `/kitchen`, `/waiter`, `/cocina`, `/garzon` redirect to login; authorized roles render; super_admin allowed.
- [ ] **DEF**: each DEF-001..DEF-007 registered with a follow-up task/PR in the backlog (verifiable tracking, not silent drops).

## API Contract

| Method | HTTP | Endpoint | Auth | Request | Success |
|--------|------|----------|------|---------|---------|
| token | GET·POST | `/api/auth/token` | Bearer session | — | 200 `{token, expires_at, claims}` |
| session | GET | `/api/auth/session` | Bearer session | — | 200 `{session, token}` |
| placeOrder | POST | `/api/orders` | capability | `{items[], capability?, customer?, notes?}` | 201 `{order, duplicate:false}` / 200 `{order, duplicate:true}` |
| myOrders | GET | `/api/orders/my?capability=` | capability | — | 200 `{orders[] with order_items→products}` |
| cancelOrder | POST | `/api/orders/:id/cancel` | capability (body) | `{capability}` | 200 `{success, cancelled}` |
| tableSessions | POST | `/api/table-sessions` | — | `{table_id, tenant_id}` | 201 `{session}` / 200 `{session, resumed}` |
| adminUsers | CRUD | `/api/admin/users` | requireAuth + role | user fields (no tenant_id except super_admin) | 201/200/204 |
| resetPassword | POST | `/api/auth/reset-password` | — | existing contract | 200 (token server-minted, 24h) |

## Error Mapping

| HTTP | Condition |
|------|-----------|
| 400 | validation, unknown product, takeout with unresolvable subdomain, table not found/expired, missing `capability` param |
| 403 | role violation (e.g. tenant_admin creating super_admin/other-tenant user) |
| 409 | self-delete |
| 429 | rate limit on any listed key |
| 401 | invalid/expired session on `requireAuth` paths |

## Edge Cases

| Case | Behavior |
|------|----------|
| Replayed order (same idempotency_key) | Existing order returned, `duplicate:true`, no new rows |
| Cancel of already-cancelled order | 0 rows, `cancelled:false` |
| Unknown/inactive capability on `orders/my` | `200 []` — no oracle |
| Capability in query string | Opaque 128-bit token, never published, rate-limited endpoint |
| `request.jwt.claims` GUC absent/unset | `app_claim_tenant_id()` returns NULL safely (null-safe `current_setting(..., true)` before jsonb cast) |
| Staff insert on claim-only table firing triggers | `update_stock_after_order` / `update_customer_stats_after_order` / `clear_insecure_password` verified under service-role AND authenticated same-tenant before apply |
| Secret rotation | Invalidates capabilities (D4 INFO — tracked, per-session key deferred) |
| Vercel cold start | JWT fetch may be slow; refresh path tolerates retries; rate-limit keys harmless |
