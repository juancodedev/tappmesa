# Proposal: Fix Critical Security Posture (REVISED — post Judgment Day R2)

**REVISION NOTE**: Rewritten after Judgment Day round 2 ESCALATED the previous approach. The old split-1 boundary (anon SELECT/INSERT on `orders`/`order_items` scoped by an `x-session-id` capability header + anon access to `table_sessions`) was live-verified as structurally unsound (R2-1..R2-5) and is DISCARDED. This revision adopts the design's own fallback DX-1-F as primary: **zero anon access to `orders` / `order_items` / `table_sessions`**; customer write/read flows move to server routes pulled forward from old split 2; loyalty trigger + table_statuses SECURITY DEFINER functions neutralized; DROP inventory completed with a full sweep. The prior `design.md` is superseded (header note added, file kept for history).

## Intent

TappMesa's multi-tenant isolation is broken at the architecture level: the anon key is the only client credential, RLS was applied with contradictory scripts (a transaction-local GUC latch no client ever sets + committed `USING(true)` policies on orders/tables), and critical write flows (order cancel, user creation, order placement, password reset) run from the browser with no server-side authority. R2 proved the intended "safe" interim also breaks — anon SELECT on `table_sessions` publishes session uuids (capability enumeration → cross-tenant orders PII dump, R2-1); the loyalty AFTER INSERT trigger aborts every anon orders insert once `customers` grants are revoked (R2-2); anon UPDATE on `table_sessions` is cross-tenant tampering (R2-3); the DROP inventory missed `tables_{insert,update,delete}_authenticated` (R2-4); the `x-session-id` header is not configurable in Supabase CORS, so browser preflight would block the customer flow (R2-5). This change restores tenant and role isolation fully server-side — JWT claims minted by the API, RLS keyed to those claims, server-side write flows, **no anon access to order/session data in any release window** — without breaking the public menu/cart path or the legitimate `super_admin` cross-tenant capability.

## Scope

### In Scope (all 6 criticals, corrected boundary)

| # | Critical | Verified evidence |
|---|----------|-------------------|
| C1 | RLS / multi-tenant isolation broken | `USING(true)` in `01/02-SETUP-ESENCIAL(-SEGURO).sql`, `fix-rls-orders.sql`, `fix-rls-tables.sql`, `fix-tables-rls-tenant-isolation.sql` (incl. `tables_{select,insert,update,delete}_authenticated` = cross-tenant I/U/D under ANY authenticated JWT, R2-4); GUC latch in `setup-rls.sql` never set by anon client; anon can cancel any order by id (`TableOrdersHistory.jsx:121-124`, no tenant filter) |
| C2 | Admin account takeover | Public `SECURITY DEFINER` `generate_password_reset_token` (public EXECUTE), `password_reset_tokens` without RLS, no rate limits (`api/auth/reset-password.js`) |
| C3 | Plaintext passwords | `UsersManager.jsx:246-257` writes `formData.password` into `admin_users.password_hash` |
| C4 | Non-atomic, non-idempotent order placement | `CartContext.jsx placeOrder`: 3 sequential supabase calls (orders insert 225-229, items insert 243-245, session update 251-257), no transaction, no idempotency key, unique `orders.order_number` absent, client-trusted totals; `table_sessions` anon UPDATE (R2-3) |
| C5 | Session wiped on any error | `src/lib/supabase.js:80-97 getCurrentSession` clears `tappmesa-session` in generic `catch`, not only on 401 |
| C6 | Staff routes unprotected | `App.jsx:128-133` — `/waiter`, `/garzon`, `/kitchen`, `/cocina` render without `ProtectedRoute` |

### Out of Scope

- NOT building a full API proxy for all ~48 direct-supabase call sites — staff/super_admin reads stay on supabase-js with claim-scoped RLS.
- NOT migrating auth to Supabase Auth (custom bcrypt + session tokens remain the auth model).
- NOT redesigning UX, IVA model contradiction, or the frontend god-object refactor.
- NOT introducing any custom CORS header (R2-5) — server routes use standard `Authorization: Bearer` + JSON bodies only.
- NOT exposing a public "is this table-session code valid" check in split 1 (session_code is display-only; the table_session uuid is the credential and is only ever returned by server routes).
- NOT fixing non-critical audit findings except where the sweep requires it (see residuals) — polling and `alert()` stay.

## Capabilities

### New Capabilities

- `secure-data-access`: server-minted JWT claims (`app_tenant_id`, `app_role`, `app_user_id`, `role: authenticated`, HS256 with `SUPABASE_JWT_SECRET`) via `/api/auth/token`; one lockdown migration (`revoke all from anon, authenticated` → explicit per-role grants → claim-based policies on `auth.jwt()`); complete DROP sweep of every legacy `USING(true)` / auth.uid() / latch policy and function (inventory below); neutralization of `add_loyalty_points_on_order` trigger, `update_table_status`, `get_next_table_status`; RLS on `password_reset_tokens` + revoked public EXECUTE; server-side admin user writes (`/api/admin/users`, bcrypt 12); `getCurrentSession` clears storage only on 401. **Order/session data: zero anon access.**
- `atomic-orders` (pulled forward into the core change): transactional, idempotent `POST /api/orders` (server-computed 19% IVA totals, unique `idempotency_key` + unique `order_number`, capability-gated cancel); `GET /api/orders/my?table_session_id=…` scoped own-order read (customer "Mis Pedidos"); `POST /api/table-sessions` (create/resume).
- `route-hardening`: `ProtectedRoute` + role check (from JWT `app_role`) on `/waiter`, `/garzon`, `/kitchen`, `/cocina`.

### Modified Capabilities

- `multi-tenant-isolation` (existing spec): enforcement shifts from app-level `.eq('tenant_id', …)` filters alone to RLS claim checks as the primary control (app-level filters remain defense-in-depth); June 2026 fixes (KitchenDashboard scoping, getCustomerHistory) must not regress.

## Approach

Core: custom JWT claims validated by PostgREST (signed with the Supabase project JWT secret) → RLS becomes real enforcement. **Corrected split-1 boundary**: `orders` / `order_items` / `table_sessions` get NO anon policy of any kind — customers never touch those tables via supabase-js; every customer order/session flow goes through server routes (service-role, transactional). Staff/super_admin reads keep supabase-js but ride claim-scoped policies via the attached JWT.

**The corrected model:**

```
customer browser (anon supabase-js, menu/cart only)      Vercel API (service role)
  menu: tenants/products/categories/tables (anon SELECT, is_active)  ← unchanged
  table session create/resume ──POST /api/table-sessions──► returns session (uuid = capability)
  place order ─────────────────POST /api/orders──────────► 1 txn: orders+order_items+session
                                                            totals; idempotency_key; order_number
  own orders ─────────────────GET /api/orders/my?table_session_id=… ► scoped by capability
  cancel ─────────────────────POST /api/orders/:id/cancel ► gated by own active session

staff/admin browser (supabase-js, anon key + JWT)         PostgREST
  Authorization: Bearer <jwt> ────────────► auth.jwt() claims → claim policies
```

- **C1 — JWT + RLS lockdown (revised boundary).** `/api/auth/token` mints the 15-min JWT after verifying `tappmesa-session` (same claims model as before: `role: authenticated`, `app_tenant_id`, `app_role`, `app_user_id`; customers get NO JWT — capability is the table_session uuid). One migration: `revoke all from anon, authenticated`; explicit grants per table (anon: menu-only tables; authenticated: claim tables; see matrix); claim policies on `app_claim_tenant_id()` / `app_is_super_admin()` helpers; complete DROP sweep (§ below). `super_admin` preserved via `app_role` OR-branch + server routes. Replaces: latch, `USING(true)` sets, and the discarded capability-header approach.
- **C2 — reset flow server-only.** Token generated inside `api/auth/reset-password.js` (service role, 32-byte CSPRNG, 24h expiry); `DROP FUNCTION generate_password_reset_token`; RLS on `password_reset_tokens` (zero policies); rate limits on request/confirm/reset.
- **C3 — users via API.** `UsersManager` → `/api/admin/users` (bcrypt 12 server-side; `tenant_id`/`role` from session claims, never client-supplied); responses strip `password_hash`.
- **C4 — orders via server routes (PULLED FORWARD from old split 2).** `POST /api/orders`: server-computed totals (19% IVA), unique `idempotency_key` + unique `order_number`, transactional insert of orders + order_items + table_sessions totals, accepts `table_session_id: null` (takeout) — tenant resolved server-side from host/subdomain, so the old "takeout blocked in split 1" regression disappears. Cancel: `POST /api/orders/:id/cancel` gated by active own table_session (new claims: none needed — server checks session ownership directly). `GET /api/orders/my?table_session_id=…`: scoped own-order read (see decision below).
- **C5 — session fix.** `getCurrentSession` clears localStorage only on 401; delete dead `src/lib/authService.js`.
- **C6 — routes.** Wrap the 4 staff routes with `ProtectedRoute` + `requireRole` (enforced by `app_role` claim; client guard is UX only).

### Decision: own-order read — scoped server route (NOT claim-based policy)

`GET /api/orders/my?table_session_id=…` (server route) is chosen over a claim-based policy. Justification, against the real callers:

- Both customer readers are anon (no JWT): `TableOrdersHistory.jsx:31-46` (30 s poller, embedded `order_items → products` shape) and `CustomerMenuHeader.jsx:30-36` (15 s poller, latest non-cancelled/delivered order). A claim-based policy would require minting customer JWTs carrying `app_table_session_id` at every session create/resume, plus refresh/rotation/revocation lifecycle for two pollers — strictly more machinery than a route that checks the session exists/is active and returns its orders.
- The route matches the pollers' exact query shape (filter by `table_session_id`, RLS-equivalent scoping server-side); capability = the table_session uuid the client already possesses — unguessable (122-bit) **and never published**, because anon `table_sessions` SELECT is removed (R2-1 fix).
- Route must be rate-limited and return the same embedded shape to keep both pollers drop-in.

### Decision: `table_sessions` — no anon access at all

- **NO anon SELECT** (R2-1: anon `SELECT status='active'` publishes all session uuids → capability enumeration → cross-tenant orders PII dump).
- **NO anon INSERT/UPDATE** (R2-3: row-state predicate is caller-independent → cross-tenant session tampering, verified `UPDATE 1`).
- Create/resume → `POST /api/table-sessions` (service role; resume by table uuid + active status; create returns the session incl. the uuid the client then uses as capability). Anon SELECT on `tables` (public menu, `unique_code` lookup, `is_active`) is unchanged and safe — no session data.
- Public "is this code valid" check: **deferred** — `session_code` is display-only; the uuid is the credential and is only returned by routes; a validate endpoint adds attack surface without gating any flow.

### Neutralizations (in the migration)

| Target | Type | Action | Rationale |
|--------|------|--------|-----------|
| `add_loyalty_points_on_order()` + `trigger_add_loyalty_points` ON orders | SECURITY INVOKER trigger reading `customers` | DROP trigger + function (R2-2) | Aborts EVERY orders insert once `customers` grants are revoked; loyalty is a separate feature, no live consumer in the critical path; design confirms before DROP |
| `update_table_status()` / `get_next_table_status()` | SECURITY DEFINER, public EXECUTE | REVOKE EXECUTE (or DROP) | Neutralize per R2 verdict; zero client `.rpc()` callers (verified) |
| `is_qr_code_expired()` / `regenerate_table_qr_code()` | SECURITY DEFINER residue (4 definition copies: `01/02-SETUP…`, `add-qr-expiration.sql`, `add-missing-table-columns.sql`) | DROP IF EXISTS | **IN SCOPE**: same vulnerability class as C2 (public SECURITY DEFINER in public schema, public EXECUTE), zero client callers (verified via grep — no `.rpc()` and no policy reference); `qr_code_expires_at` is enforced in app code per `CLAUDE.md` |
| `get_top_products()` (client-called `.rpc()`, SECURITY DEFINER, caller-supplied tenant_id) | Analytics IDOR (metrics, no PII) | **Residual, see Open Questions** | Caller-supplied `tenant_id` = cross-tenant analytics read; fix via claim-guard or route in the hardening change; not a criticals blocker |
| `update_stock_after_order()` (trigger ON order_items) / `update_customer_stats_after_order()` (trigger ON orders) | SECURITY INVOKER triggers referencing claim-only tables | **Verify, don't drop** | After lockdown, inserts run as service role (bypassrls) → OK; staff `CreateOrderModal` inserts run as authenticated → design/spec must verify same-tenant claim passes under the trigger; do NOT drop (stock flow is live) |
| `user_has_permission()` (add-waiter-role.sql:116) | SECURITY DEFINER | Verify no caller → REVOKE/DROP | Zero client `.rpc()` callers found; design confirms |

### Complete DROP inventory (`USING(true)` / auth.uid() / latch)

Grep of `database/*.sql` for `CREATE POLICY` + `USING(true)`/`WITH CHECK(true)`/`auth.uid()` enumerates **38 named policies + 4 dynamic per-table families (≈ 60 names)** the migration must drop with `DROP POLICY IF EXISTS`:

| Source file | Policies (name ON table) |
|-------------|--------------------------|
| `01-SETUP-ESENCIAL.sql`, `02-SETUP-ESENCIAL-SEGURO.sql`, `fix-rls-orders.sql` | `orders_select_all`, `orders_insert_all`, `orders_update_all`, `orders_delete_all` ON orders; `order_items_all` ON order_items — `USING/WITH CHECK (true)` |
| `fix-rls-orders.sql` | `orders_tenant_based_{select,insert,update,delete}` ON orders — latch-keyed |
| `setup-rls.sql` | `tenants_{select,insert,update}`; `admin_users_{select,insert,update}`; `admin_sessions_all`; `role_permissions_all`; `order_items_tenant_access`; **dynamic `%I_tenant_{select,insert,update,delete}`** — resolve concrete names (`products_tenant_select` etc.) from the script's table list; design derives + cross-checks against live `pg_policies` snapshot |
| `fix-rls-tables.sql` (+ 01/02 dupes) | `tables_{select,insert,update,delete}_all` ON tables |
| `fix-tables-rls-tenant-isolation.sql` | `tables_{select,insert,update,delete}_authenticated` ON tables — **R2-4 gap (lines 30,34,41,49); all four, not just select** |
| `fix-rls-customer-history.sql` | `customer_order_history_tenant_access` ON customer_order_history |
| `create-table-statuses.sql` | `table_statuses_{select,insert,update,delete}_all` ON table_statuses |
| `create-loyalty-system.sql` | 7 named: manage loyalty programs (loyalty_programs), view customer loyalty (customer_loyalty), manage coupons (coupons), manage customer coupons (customer_coupons), view loyalty transactions (loyalty_transactions), manage campaigns (marketing_campaigns), view campaign recipients (campaign_recipients) — all `auth.uid()`-keyed |

`DROP FUNCTION IF EXISTS` list (latch infra): `get_current_tenant_id`, `set_tenant_context` (verified dead — no `.rpc()` caller in repo), `clear_tenant_context`, `is_tenant_admin`, `create_tenant_policies`; plus C2 `generate_password_reset_token`; plus QR residue `is_qr_code_expired`, `regenerate_table_qr_code`.

### Frontend call-site migration (now required — previously "no call-site edits")

| File (lines) | Today | After | Channel |
|--------------|-------|-------|---------|
| `CartContext.jsx:16-21` | `orders` count for order_number | order_number generated server-side inside `POST /api/orders` | route |
| `CartContext.jsx:225-257` | 3-call insert (orders, order_items, table_sessions totals) | `POST /api/orders` (transactional) | route |
| `TableOrdersHistory.jsx:31-46` | 30 s poller, embedded read by `table_session_id` | `GET /api/orders/my?table_session_id=…` same shape | route |
| `TableOrdersHistory.jsx:121-124` | cancel UPDATE by id, no tenant filter (C1) | `POST /api/orders/:id/cancel` (capability-gated) | route |
| `CustomerMenuHeader.jsx:30-36` | 15 s poller, latest active order | `GET /api/orders/my?table_session_id=…` | route |
| `TenantContext.jsx:159-187` | `table_sessions` SELECT (resume) + INSERT (create) | `POST /api/table-sessions` | route |
| `KitchenDashboard.jsx:50,95`; `ActiveOrdersPanel.jsx:48`; `OrdersManager.jsx:58,104`; `Dashboard.jsx:72`; `preBillService.js:15`; `WaiterDashboard.jsx:59`; `TablesGrid.jsx:49`; `CreateOrderModal.jsx:135-211`; `SuperAdminOrdersManager.jsx:59`; `SuperAdminTenantsManager.jsx:120`; `TenantTester.jsx:62` (dev) | direct reads/writes | unchanged call shape — **staff/super = authenticated JWT claims** | supabase-js + `setAccessToken(jwt)` |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/supabase.js` | Modified | `export let supabase` + `setAccessToken(jwt)` attach; 401-only session clear (C5); delete dead `src/lib/authService.js` |
| `src/context/CartContext.jsx` | Modified | `placeOrder` → `POST /api/orders` (225-257); drop client order_number count (16-21) |
| `src/context/TenantContext.jsx` | Modified | `createOrResumeTableSession` → `POST /api/table-sessions` (156-197) |
| `src/context/AuthContext.jsx` | Modified | JWT fetch/attach on signin/restore; 401-based refresh |
| `src/components/table/TableOrdersHistory.jsx` | Modified | Poller → `GET /api/orders/my` (31-46); cancel → gated route (121-124) |
| `src/components/layout/CustomerMenuHeader.jsx` | Modified | Poller → `GET /api/orders/my` (30-36) |
| `src/components/admin/UsersManager.jsx` | Modified | CRUD via `/api/admin/users`; remove plaintext write (246-257) |
| `src/App.jsx`, `src/components/ProtectedRoute.jsx` | Modified | Staff route protection + `requireRole` (128-133) |
| `api/auth/token.js`; `api/middleware/requireAuth.js`; `api/admin/users.js`; `api/orders.js`; `api/table-sessions.js` | New | JWT mint; session verify helper; bcrypt user writes; transactional orders + own-order read + cancel; table-session create/resume |
| `api/auth/reset-password.js`, `api/middleware/rateLimit.js` | Modified | Server-only token mint; rate-limit keys (`auth/token`, reset confirm/reset, `orders`, `table-sessions`, `orders/my`) |
| `database/secure-data-access.sql` (+ rollback twin) | New | One lockdown migration: revoke-all → grants → claim policies → neutralizations → complete DROP sweep (§ inventory) |
| `database/{setup-rls,fix-rls-orders,fix-rls-tables,fix-tables-rls-tenant-isolation,fix-rls-customer-history}.sql`, `02-SETUP-ESENCIAL-SEGURO.sql` `USING(true)` blocks | Deleted/replaced | Superseded by the migration (keep `migrate-to-secure-auth.sql`) |
| `prisma/schema.prisma` | Modified | `idempotency_key` unique, `order_number` unique |
| `package.json`, `.env.local.sample`, Vercel env | Modified | `jsonwebtoken`; `SUPABASE_JWT_SECRET` (server-only) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Lockout during flip (revoke before grants/policies) | Med | Single-transaction migration with grants+policies ordered before effective revoke of `USING(true)` sets; verify anon menu + claim-auth'd test query pre/post commit; rollback SQL staged |
| R2-2 class: trigger referencing claim-only tables breaks inserts | Med | `add_loyalty_points_on_order` neutralized; design/spec MUST verify `update_stock_after_order` + `update_customer_stats_after_order` under service-role AND authenticated (staff `CreateOrderModal`) inserts before apply |
| Residual policy-enumeration gap (R2-4 class) | Med | Migration built from THIS inventory (38 named + 4 dynamic families) AND diffed against a live `pg_policies` pre-flight snapshot; verify asserts zero `USING(true)`/`auth.uid()` policies remain via SQL query |
| Customer table flow regression during the flip | Med | Server routes live and verified BEFORE the migration commits (routes are dormant-safe additive); day-of step order (§ Rollback); frontend flips in the same release as the migration |
| Custom JWT rejected by PostgREST (claim/`role` mismatch) | Low | Mechanism verified (HS256 + project secret + `role` claim); test token query before lockdown |
| Customer capability (table_session uuid) in `GET /api/orders/my` query string | Low | Uuids never published (no anon `table_sessions` read); optional opaque per-session capability token — Open Question; route rate-limited |
| `super_admin` cross-tenant regression | Med | `app_role` OR-branch in policies + server routes for users/orders manage paths; validate list/create/switch in spec scenarios |
| Analytics residual `get_top_products` IDOR stays during splits 1-2 | Low-Med | Metrics-only, no PII; fixed in hardening change (claim-guard or route) — Open Question |
| Token expiry → mid-session 401s (staff) | Med | Short TTL + silent refresh via `/api/auth/token` on 401 before clearing session |

## Rollback Plan

- **Flip rollback (critical)**: run `database/rollback-secure-data-access.sql` (re-grant anon/authenticated, drop claim policies/helpers, restore snapshot from pre-flight `pg_policies`) → anon access returns instantly; server routes go dormant; previous frontend redeploy safe (old direct-insert code retained as deploy artifact until switchover confirmed).
- Pre-flight: snapshot current `pg_policies` + grants from live Supabase before the migration (unverifiable from repo), so revert restores the exact prior state.
- Prior changes are additive (`/api/auth/token`, users/orders/table-sessions routes, `ProtectedRoute` wrappers) — removable by revert commit; rate-limit keys harmless.

## Dependencies

- `SUPABASE_JWT_SECRET` configured in Vercel env + local `.env` (server-side only, never `VITE_`).
- Existing service-role key in API routes (already present).
- Optional user confirmation of live RLS state (removes verification flags only, never the rework).
- Vercel KV if rate limits must be shared across lambdas (in-memory fallback acceptable).

## Re-sequenced split plan (new boundaries, ~800-line review budget)

With atomic-orders pulled forward, anon access to order/session tables is removed in ONE release window — the server routes must be live before the migration commits, so C4's server core can no longer be a separate later split. Recommended: **3 sequenced changes**, each with its own spec/design/tasks/apply/verify.

1. **`server-data-routes`** (new foundation; ~1,000-1,300 lines, mostly additive): JWT mint (`/api/auth/token` + `requireAuth` + `session.js` token field), `/api/admin/users` (C3), reset hardening (C2), `POST /api/orders` + `GET /api/orders/my` + cancel + `POST /api/table-sessions` (C4 server core), C5, rate-limit keys, `SUPABASE_JWT_SECRET` env; frontend additive plumbing (AuthContext token attach, UsersManager → API). **No lockdown yet — anon flows unchanged**, so this lands dormant-safe; review per-route.
2. **`rls-lockdown-flip`** (the security-critical release; ~900-1,200 lines): the ONE migration (revoke → grants → claim policies; neutralizations; complete DROP sweep incl. R2-4 names, QR fns, triggers); frontend flips (CartContext, TableOrdersHistory, CustomerMenuHeader, TenantContext); script deletions; day-of apply order + verification. MUST ship in the same release window as #1. This is where the security review concentrates — the surface is bounded by the inventory tables above.
3. **`route-hardening`** (C6 + residuals; ~300-600 lines): `ProtectedRoute` + `requireRole` on the 4 staff routes; optional polling→realtime; UX error copy; `get_top_products` claim-guard or route.

Dependency order: 1 → 2 (2 requires routes live), 1 → 3 (3 requires `app_role` claims). 2 and 3 are independent. **Do NOT collapse to one ~2,000+ line security release**: that is exactly the review-size pressure that let R2-4 slip past two judges; keeping the additive-vs-flip boundary means the risky diff is the one reviewers can hold fully in memory.

## Downstream coordination (design/tasks must verify — R2-derived)

- **No anonymous capability publication**: no anon SELECT/INSERT/UPDATE on `orders`, `order_items`, `table_sessions` in ANY split; the table_session uuid is only ever returned by `POST /api/table-sessions` / `GET /api/orders/my` scoping, never by an anon table read.
- **No revoke-then-broken-trigger**: verify every trigger on `orders`/`order_items` (`update_stock_after_order`, `update_customer_stats_after_order`, `trigger_clear_insecure_password`) fires cleanly under service-role AND authenticated claim-scoped inserts (same-tenant) — and confirm `add_loyalty_points_on_order`/`trigger_add_loyalty_points` is actually dropped (R2-2 regression test).
- **Complete policy inventory**: migration DROP list = the 38 named + 4 dynamic families above, cross-checked at apply time against the live `pg_policies` snapshot; verify phase runs a SQL query asserting zero `USING(true)` / `auth.uid()` policies remain (not just the named ones).
- **CORS-neutral**: no custom headers anywhere (R2-5); routes use standard `Authorization` + JSON; no `x-session-id`, no `setAnonSession`.
- **Verified cap-gating**: `POST /api/orders/:id/cancel` and `GET /api/orders/my` reject foreign/unknown session ids with 0-rows/401 semantics; double-submit creates exactly one order.

## Open Questions (for design/tasks phases)

1. `SUPABASE_JWT_SECRET` obtainable for the live project before apply?
2. `session.js` returning the JWT alongside the session (single round-trip) vs separate `/api/auth/token` call?
3. Own-orders capability: raw table_session uuid (current status-quo trust model) vs opaque per-session token column with rotation on resume?
4. `POST /api/orders` transactional scope: only `orders` + `order_items` (+ session totals), or also stock movements / `customer_order_history` / loyalty (old Q5)?
5. Loyalty neutralization: DROP `add_loyalty_points_on_order` + trigger (recommended) vs defensive service-role-only — confirm no live consumer of `customer_loyalty` / loyalty transactions.
6. `update_table_status` / `get_next_table_status`: REVOKE EXECUTE vs DROP (zero client callers)?
7. Dynamic `%I_tenant_*` family: derive the concrete per-table policy names for the migration from `setup-rls.sql` and cross-check with the live snapshot.
8. `get_top_products`: claim-guard inline (`app_claim_tenant_id()`) vs defer to hardening change (recommended: defer; metrics-only).
9. `is_business_open` (SECURITY DEFINER) + business-hours reads: confirm no anon caller before REVOKE.
10. Takeout (`table_session_id: null`): route resolves tenant from host/subdomain — confirm no flow requires a session for takeout orders in the current UI.

## Success Criteria

- [ ] Anon-key client with NO JWT reads 0 rows on `orders`, `order_items`, `table_sessions`, `admin_users`, `admin_sessions`, `password_reset_tokens`; zero `USING(true)` / auth.uid() policies remain (`pg_policies` query); inventory drops confirmed incl. `tables_{select,insert,update,delete}_authenticated`, QR functions, loyalty trigger.
- [ ] `POST /api/orders` double-submit (same idempotency_key) creates exactly 1 order; `order_number` unique; totals = server-computed 19% IVA; session totals updated in the same transaction; takeout orders work.
- [ ] `GET /api/orders/my` with unknown/foreign `table_session_id` returns 0 rows; missing param → 400; cancel with foreign session id affects 0 rows.
- [ ] Cross-tenant staff claim (tenant A JWT → tenant B row) affects 0 rows on every claim table, including staff `CreateOrderModal` writes (triggers verified).
- [ ] UsersManager-created users have bcrypt hashes in `password_hash` (DB query); route responses have no `password_hash` key.
- [ ] Killing the network mid-session does not clear localStorage; a 401 does.
- [ ] Unauthenticated `/kitchen`, `/waiter`, `/cocina`, `/garzon` redirect to login.
- [ ] `super_admin` can still list/switch tenants via server-validated paths (SystemUsersManager, SuperAdmin context).
- [ ] Public menu/cart/table flow works (no customer-facing regression): menu reads, session create/resume, place order, "Mis Pedidos" pollers.
- [ ] `pnpm test:run` passes; June 2026 fixes (bcrypt auth, tenant-scoped kitchen/history, CSP, CSPRNG sessions) verified not regressed.