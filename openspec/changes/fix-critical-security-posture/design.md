# Design: Fix Critical Security Posture (v2 — post judgment-day R2)

> **Iteration history**
> - **v1 (SUPERSEDED)**: split-1 anon `orders`/`order_items`/`table_sessions` access scoped by an `x-session-id` capability header + anon `table_sessions` SELECT. ESCALATED by R2 with live-tested evidence: R2-1 anon `table_sessions` SELECT publishes session uuids → capability enumeration → cross-tenant orders PII dump; R2-2 loyalty trigger (`add_loyalty_points_on_order`, SECURITY INVOKER reading `customers`) aborts every anon orders insert once `customers` grants are revoked; R2-3 anon `table_sessions` UPDATE is cross-tenant tampering (verified `UPDATE 1`); R2-4 DROP inventory missed `tables_{insert,update,delete}_authenticated` (fix-tables-rls-tenant-isolation.sql:34,41,49); R2-5 `x-session-id` is not configurable in Supabase CORS (PostgREST static allow-list) — browser preflight would block the customer flow.
> - **v2 (current)**: zero anon access to `orders`/`order_items`/`table_sessions` (uuid never published; capability = opaque HMAC token); customer order/session flows move to server routes (pulled forward); loyalty trigger + `table_statuses` SECURITY DEFINERs + QR residue neutralized; complete DROP sweep (introspection-driven + named inventory); CORS-neutral (`Authorization` + JSON only).

## 1. Technical Approach

Server-minted custom JWTs (HS256, `SUPABASE_JWT_SECRET`) validated by PostgREST → RLS becomes real enforcement (claim-scoped policies), replacing the contradictory latch/`USING(true)` script set. Customer order/session flows run exclusively through Vercel API routes (service role, transactional, idempotent, IVA server-computed); staff/super_admin reads stay on supabase-js but ride claim-scoped policies via the attached JWT.

```
customer browser (anon supabase-js: menu/cart only)     Vercel API (service role)
  menu: tenants/products/categories/tables (anon SELECT)  ← unchanged
  session create/resume ──POST /api/table-sessions──► returns session uuid + capability_token
  place order ───────────POST /api/orders─────────► 1 txn: orders + order_items + session
                                                      totals; idempotency_key; order_number; IVA
  own orders ────────────GET /api/orders/my?capability=… ► scoped by capability
  cancel ────────────────POST /api/orders/:id/cancel ► gated by own active session

staff/admin browser (supabase-js, anon key + JWT)        PostgREST
  Authorization: Bearer <jwt> ────────────► auth.jwt() claims → claim policies (app_role OR-branch)
```

Map to proposal: capabilities `secure-data-access` (C1/C2/C3/C5), `atomic-orders` (C4, pulled forward), `route-hardening` (C6).

## 2. Architecture Decisions

| # | Decision | Alternatives | Why |
|---|----------|--------------|-----|
| D1 | **JWT mint**: `api/auth/token.js` + inline in `api/auth/session.js` (single round-trip), signed HS256 with `SUPABASE_JWT_SECRET` via `jsonwebtoken` (new dep, server-only env) | full API proxy for 48 call sites; RPC-per-policy | Proxy doesn't scale; RPC-per-policy is slow. PostgREST accepts any JWT signed with project secret + `role` claim (verified mechanism). **TTL 60 min** (explicit requirement; proposal's 15-min rejected — polling dashboards would refresh every ~10 min) |
| D2 | **Token delivery**: keep `tappmesa-session` (long-lived, localStorage, unchanged auth flow); JWT stored in new key `tappmesa-jwt`, replaced on refresh | cookie | Cookie across tenant subdomains (`.tappmesa.com`) would need SameSite/Path math + CORS on API; localStorage matches the existing same-origin-per-subdomain model; JWT is a short-lived capability derived from the session |
| D3 | **Live-binding swap**: `export let supabase` + `setAccessToken(jwt)` rebuilding the client with `global.headers: { Authorization: Bearer <jwt> }`; `export let` ESM live-binding propagates to ~40 importers — **zero call-site edits for reads** | `.withToken()` per call site | Vite ESM guarantees live bindings (verified pattern); fallback documented for apply phase |
| D4 | **Customer capability = opaque token**: new `table_sessions.capability_token` = `ts_` + base64url(HMAC-SHA256(session_uuid, SUPABASE_JWT_SECRET, tag `tappmesa-capability-v1`)), unique index, one-way, issued at create, returned by routes, cleared on session end | raw table_session uuid; random secret stored server-side | Task requires opaque (NOT raw uuid) for cancel; deterministic HMAC needs no extra column for a key and survives serverless restarts; 128 bits+, never published (no anon `table_sessions` read). Dual-mode: routes also accept raw uuid during the flip, deprecated in split 3 |
| D5 | **Own-order read** = `GET /api/orders/my?capability=…` server route (NOT claim policy) | claim-based policy with customer JWTs carrying `app_table_session_id` | Both pollers are anon (no JWT); claim approach needs mint/rotate/revoke lifecycle for 2 pollers — strictly more machinery. Route matches pollers' exact embedded shape (`order_items → products`) |
| D6 | **`table_sessions`**: zero anon access; create/resume via `POST /api/table-sessions`; anon `tables` SELECT unchanged (public menu, `unique_code` lookup) | anon scoped SELECT/INSERT/UPDATE | R2-1/R2-3 binding: no anon capability publication, no caller-independent predicates |
| D7 | **Order placement tx**: plpgsql **INVOKER** fn `tappmesa_place_order(...)` (REVOKE PUBLIC execute; service-role-only via `.rpc()`) containing one transaction: INSERT orders (`ON CONFLICT (idempotency_key) DO NOTHING`) → order_items → session totals; IVA/`order_number` computed inside from **DB product prices**; replay returns existing order | 3 sequential supabase calls (today); SECURITY DEFINER fn | Atomicity (C4) via one RPC call (PostgREST wraps in a txn); not SECURITY DEFINER (invoker = service role, bypassrls) so no new privilege surface; server-authoritative prices close client-trusted-totals |
| D8 | **Loyalty**: DROP `add_loyalty_points_on_order` + `trigger_add_loyalty_points` (R2-2) | keep with service-role-only guard | Zero live consumers in critical path (grep: no client `.rpc()`; loyalty policies are auth.uid()-keyed = dead under custom JWT); it reads `customers` (claim-only) → R2-2 class |
| D9 | **`table_statuses`**: DROP `update_table_status` + `get_next_table_status` | REVOKE EXECUTE | Zero client callers (verified); SECURITY DEFINER + public EXECUTE with inherent cross-tenant write capability in signature; DROP removes the surface; rollback re-applies from `database/archive/` |
| D10 | **QR residue**: DROP `is_qr_code_expired` + `regenerate_table_qr_code` (4 definition copies) | REVOKE | Same C2 class; zero `.rpc()` callers; `qr_code_expires_at` enforced in app code + server table-session route |
| D11 | **Analytics DEFINER family** (gap vs proposal): REVOKE EXECUTE FROM PUBLIC on `get_top_products`, `get_daily_sales_metrics`, `get_low_stock_alerts`, `get_customer_metrics`, `get_sales_report`, `cleanup_expired_sessions`, `is_business_open`, `user_has_permission`; **claim-guard `get_top_products` inline** (`IF NOT (app_claim_tenant_id() = tenant_id_param OR app_is_super_admin()) THEN RAISE`) + GRANT EXECUTE TO authenticated (only live caller: `analyticsService.getTopProducts`, Dashboard) | defer all to split 3 (proposal OQ8 "defer") | SECURITY DEFINER reads order-derived totals — leaving PUBLIC execute violates "no anon access to order data in any release window" at the flip moment; claim-guard is ~10 lines in the same migration and keeps Dashboard live. Route-based rewrite remains optional split-3 work |
| D12 | **Latch infra**: DROP `get_current_tenant_id`, `is_tenant_admin`, `set_tenant_context`, `clear_tenant_context`, `create_tenant_policies`; delete `src/middleware/tenantResolver.js` (dead code — only caller of `set_tenant_context`, zero importers) | keep, rewire | NULL-latch is the C1 root (isset branch grants anon full read); closing it must include the unimported file that would call a dropped fn |
| D13 | **Grants matrix** (§4): menu tables (tenants/products/categories/tables + reservations) keep scoped anon; claim tables (orders, order_items, table_sessions, customers, customer_order_history, table_statuses, tenant_settings, business_hours, stock_inventory/stock_movements/stock_alerts/suppliers, pre_bills, surveys, tenant_subscriptions) zero anon, authenticated claim-scoped; auth tables (admin_users, admin_sessions, admin_audit_logs, password_reset_tokens, role_permissions, profiles, loyalty 7, inventory*, restaurant_tables) server-only (service role), zero grants | anon `USING(true)` (today); claim-only everything | Menu/cart/table flows must keep working (proposal constraint); **stock_* grants TO authenticated are required** — `update_stock_after_order` (AFTER INSERT ON order_items, INVOKER) writes them under staff `CreateOrderModal` claim inserts (R2-2 class: grants exist in the same migration) |
| D14 | **C2**: DROP `generate_password_reset_token`; `password_reset_tokens` RLS ON + zero policies; route mints 32-byte CSPRNG token (24h), deletes previous; rate limits on confirm/reset | keep RPC, restrict EXECUTE | Public EXECUTE SECURITY DEFINER returning tokens is the takeover vector; kill the surface entirely |
| D15 | **C5**: `getCurrentSession` clears `tappmesa-session` ONLY on `status === 401` (network/5xx propagate); delete dead `src/lib/authService.js` (zero importers verified) | keep, tweak status check | C5 per proposal; silent JWT refresh on 401 via `/api/auth/token` before clearing |

## 3. Data Flow

```
signin ──POST /api/auth/signin──► { sessionToken } ──► localStorage tappmesa-session
restore ──GET /api/auth/session──► { session, token } ──► localStorage tappmesa-jwt
                                                              │
                  supabase-js (staff/admin) ◄── setAccessToken(token) ──┘
                        │  Authorization: Bearer <jwt>
                        ▼
                   PostgREST → auth.jwt() → app_claim_tenant_id() / app_is_super_admin() → claim policies

table flow ──POST /api/table-sessions──► { id, capability_token } ──► cart/orders/my/cancel carry capability
place ──POST /api/orders──► tappmesa_place_order (1 txn) ──► orders + order_items + session totals { order_number }
poll ──GET /api/orders/my?capability=x──► { orders[] w/ order_items→products } (same shape as today)
cancel ──POST /api/orders/:id/cancel──► status='cancelled' (own session only)
```

Capability flows in **body or query** only — no custom headers (R2-5/CORS-neutral binding).

## 4. Lockdown Migration — `database/secure-data-access.sql` (split 2, single file, one transaction)

Ordering constraint: **DROP policies → DROP functions (triggers first) → REVOKE EXECUTE → REVOKE/GRANT → CREATE claim helpers → CREATE policies → COMMIT**. Dropping latch-keyed policies before `get_current_tenant_id` avoids dependency errors; dropping `trigger_add_loyalty_points` before revoking `customers` grants neutralizes R2-2 in the same migration.

1. **Introspective DROP sweep** (completeness guarantee — catches live-DB-only scripts like `TEMP_DISABLE_RLS.sql`/`fix-rls-policies.sql` the repo lacks): `DO $$` over `pg_policies` on `public` dropping every policy whose `qual`/`with_check` contains `true` (bare), `auth.uid()`, `get_current_tenant_id`, `is_tenant_admin`, or whose name matches legacy patterns (`%_all`, `%_tenant_access`, `orders_tenant_based_%`, `%_tenant_%`, `%_authenticated`, `tenants_%`, `admin_users_%`, `admin_sessions_all`, `role_permissions_all`, loyalty quoted names). Also drop the **named inventory** (already covered by introspection, kept explicit for review): 40 named policies per table — `01/02-SETUP-ESENCIAL(-SEGURO).sql`+`fix-rls-orders.sql` (`orders_select_all`/`insert_all`/`update_all`/`delete_all`, `order_items_all`), `fix-rls-orders.sql` (`orders_tenant_based_{select,insert,update,delete}`), `setup-rls.sql` (`tenants_{select,insert,update}`, `admin_users_{select,insert,update}`, `admin_sessions_all`, `role_permissions_all`, `order_items_tenant_access`), `01/02+fix-rls-tables.sql` (`tables_{select,insert,update,delete}_all`), `fix-tables-rls-tenant-isolation.sql` (**`tables_{select,insert,update,delete}_authenticated` — R2-4, all four**), `fix-rls-customer-history.sql` (`customer_order_history_tenant_access`), `create-table-statuses.sql` (`table_statuses_{select,insert,update,delete}_all`), `create-loyalty-system.sql` (7 quoted `auth.uid()` names). Dynamic family: 19 tables from `setup-rls.sql` call list × 4 (`%I_tenant_{select,insert,update,delete}`) — only tables that exist in the live DB produce rows; introspection handles the rest.
2. **DROP FUNCTION**: `get_current_tenant_id`, `is_tenant_admin`, `set_tenant_context`, `clear_tenant_context`, `create_tenant_policies`, `generate_password_reset_token`, `is_qr_code_expired`, `regenerate_table_qr_code`, `update_table_status`, `get_next_table_status`; `DROP TRIGGER trigger_add_loyalty_points ON orders` then `DROP FUNCTION add_loyalty_points_on_order`. Trigger dependency check (R2-2 class, keep + verify): `update_stock_after_order` (AFTER INSERT order_items), `update_customer_stats_after_order` (AFTER UPDATE orders), `clear_insecure_password` (AFTER UPDATE admin_users) — all fire under service-role writes (bypassrls) and for the two order triggers under authenticated staff writes the same-tenant claim passes + `stock_*` grants exist (D13); verified by scenario tests, NOT dropped (stock flow live).
3. **REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC**: analytics family `get_top_products`, `get_daily_sales_metrics`, `get_low_stock_alerts`, `get_customer_metrics`, `get_sales_report`, `cleanup_expired_sessions`, `is_business_open` (zero anon callers verified), `user_has_permission` (zero callers). Claim-guard `get_top_products` (D11) + `GRANT EXECUTE TO authenticated`.
4. **REVOKE/GRANT** (per D13 matrix): `REVOKE ALL ON orders, order_items, table_sessions, customers, customer_order_history, table_statuses, tenant_settings, business_hours, stock_inventory, stock_movements, stock_alerts, suppliers, pre_bills, surveys, tenant_subscriptions FROM anon, authenticated`; `REVOKE ALL ON admin_users, admin_sessions, admin_audit_logs, password_reset_tokens, role_permissions, profiles, loyalty_programs, customer_loyalty, coupons, customer_coupons, loyalty_transactions, marketing_campaigns, campaign_recipients FROM anon, authenticated` (server-only); `GRANT SELECT ON tenants, products, categories, tables TO anon` (menu); `GRANT SELECT, INSERT, UPDATE, DELETE ON tenants, products, categories, tables, orders, order_items, table_sessions, customers, customer_order_history, table_statuses, tenant_settings, business_hours, stock_inventory, stock_movements, stock_alerts, suppliers, pre_bills, surveys, tenant_subscriptions TO authenticated` (claim tables); `GRANT SELECT, INSERT, UPDATE ON reservations TO anon` (existing public reservation flow, `status='confirmed'` scoped).
5. **Claim helpers** (replaces latch; PG-safe null-guard before jsonb cast): `app_claim_tenant_id()` → `(nullif(current_setting('request.jwt.claims', true),'')::jsonb ->> 'app_tenant_id')::uuid`; `app_is_super_admin()` → `nullif(...)::jsonb ->> 'app_role' = 'super_admin'`. `auth.uid()` never used (dead under custom auth).
6. **Claim policies** (every claim table): `FOR ALL TO authenticated USING (tenant_id = app_claim_tenant_id() OR app_is_super_admin()) WITH CHECK (same)` — incl. `order_items` (join via orders, `order_items` has no tenant_id) and `customer_order_history` (join via orders). Menu tables: anon `SELECT USING (is_active = true)` (+ `is_available`/`unique_code` for products/tables); authenticated `FOR ALL` claim-scoped. `tenants`: anon SELECT `is_active=true` (public menu lookup via `subdomain`); authenticated SELECT/UPDATE + superadmin. `password_reset_tokens`, `admin_*`, `role_permissions`, `profiles`, loyalty tables: RLS enabled (where not already) + **zero policies** = service-role only. `reservations`: anon SELECT/INSERT `status='confirmed'` (unchanged behavior, residual flagged §R).
7. **Indexes**: `capability_token` unique, `idempotency_key` unique, `order_number` unique (schema added split 1; migration only confirms).
8. `COMMIT`; companion `database/rollback-secure-data-access.sql` (reverse DDL + re-create archived objects).

## 5. Server Routes (split 1 `server-data-routes`; dormant-safe until flip)

Pattern: CJS Vercel route, `corsMiddleware(['GET','POST','OPTIONS'])` (standard allow-list — **no custom headers**), `blacklistMiddleware`, `rateLimiter('<key>')`, `requireAuth` (Bearer `tappmesa-session` → resolves `admin_sessions` + `admin_users` → claim object).

| Route | Auth | Input → Validation | Behavior | Errors / Rate |
|-------|------|--------------------|----------|---------------|
| `GET /api/auth/session` (mod) | Bearer session | — | existing session payload + `token` (JWT, 60 min) inline — single round-trip (OQ2) | 401 invalid/expired; `auth/token` default |
| `GET·POST /api/auth/token` (new) | Bearer session | — | mint `{ token, expires_at, claims }`; refresh path on 401 (C5) | 401; `auth/token` |
| `POST /api/orders` (new) | PUBLIC (capability) | `items[] {product_id: uuid, quantity 1–99, notes ≤500, temperature 'hot'\|'cold'}`, `capability?`, `customer {name?, phone?}`, `notes?` — `validateBody` | **Tenant**: capability → session.tenant_id; takeout (no capability) → subdomain from `Host` header (`[x]-tappmesa.vercel.app` / `.tappmesa.com` / `.localhost`) → tenants; 400 if unresolvable. **Tx**: `.rpc('tappmesa_place_order')` — prices read from DB, IVA 19% server-computed (D7), `order_number` `YYMMDD-XXXXXX` CSPRNG w/ unique retry ×3, `ON CONFLICT (idempotency_key) DO NOTHING` → replay returns existing order | 201 `{order, duplicate:false}`; 200 `{order, duplicate:true}`; 400 validation/unknown product/takeout-no-subdomain; 429 `orders` (30/min/IP) |
| `GET /api/orders/my` (new) | PUBLIC | `?capability=` (uuid accepted dual-mode) | resolve session (active) → orders + embedded `order_items → products` (same shape as `TableOrdersHistory.jsx:31-46`) desc | missing param 400; **unknown/inactive session → 200 `[]`** (no oracle); 429 `orders/my` |
| `POST /api/orders/:id/cancel` (new) | PUBLIC | body `{capability}` (uuid dual-mode) | `UPDATE orders SET status='cancelled' WHERE id=:id AND table_session_id=<resolved> AND status='pending'` — server-side session-ownership check (no client tenant filter, closes C1 cancel hole) | 200 `{success, cancelled}` (foreign → `cancelled:false`, no oracle); 429 `orders` |
| `POST /api/table-sessions` (new) | PUBLIC | `{table_id: uuid, tenant_id: uuid}` | verify `tables` row (tenant match, `is_active`, `qr_code_expires_at` not passed — mirrors `TenantContext.jsx:120-127` server-side) → resume active session (`tenant_id,table_id,status='active'` desc limit 1) or INSERT (`session_code` `{code}-{ts36}` server-side, `capability_token` minted) | 200 `{session, resumed}` / 201 `{session}` incl. `capability_token`; 400 table not found/expired; 429 `table-sessions` |
| `CRUD /api/admin/users` (new, C3) | `requireAuth` + role | `email/password/full_name/phone?/role/is_active`; `tenant_id` only for super_admin | bcrypt 12 server-side; `tenant_admin` → own tenant only, role allowlist (never `super_admin`); responses strip `password_hash`; audit log rows; dup-email check per tenant | 201/200/204; 400 validation; 403 role; 409 self-delete; 429 `admin/users` |
| `api/auth/reset-password.js` (mod, C2) | PUBLIC | existing | `handleResetRequest`: replace `.rpc('generate_password_reset_token')` with `crypto.randomBytes(32).toString('hex')` + service-role INSERT (24h, delete previous); confirm/reset unchanged + rate limits | 429 `auth/reset-password/confirm`, `auth/reset-password/reset` |

JWT payload (D1): `{ role:'authenticated', sub, app_tenant_id: uuid|null, app_role: tenant_admin|staff|waiter|kitchen|super_admin, app_user_id, iat, exp: +3600, iss:'tappmesa-api' }` — signed `jsonwebtoken` HS256 `SUPABASE_JWT_SECRET`; verified service-side (`jwt.verify`) where claims bypass RLS is not possible. Super admin: `app_role='super_admin'` OR-branch + server routes; NULL latch closed (D12).

## 6. Frontend Flip Plan (split-annotated)

| Component (call site) | Today | After | Channel | Split |
|---|---|---|---|---|
| `src/lib/supabase.js` (exports, 12-14; `getCurrentSession` 80-100) | anon client, clears on any error | `export let` + `setAccessToken`; **clear only on 401** (C5) | — | 1 |
| `src/context/AuthContext.jsx` (72-107, 134-166) | restore/login sets user | attach JWT (`tappmesa-jwt`) immediately after session resolves, **before** `SET_USER` (TenantProvider depends on it); silent refresh on 401 | — | 1 |
| `src/components/admin/UsersManager.jsx` (246-257) + `SystemUsersManager.jsx` | plaintext `password_hash` insert | CRUD via `/api/admin/users`; remove plaintext (C3) | route | 1 |
| `src/lib/authService.js` | dead duplicate | **deleted** | — | 1 |
| `src/context/CartContext.jsx` (16-21, 225-257) | client count order_number; 3-call insert | `placeOrder` → `POST /api/orders`; drop count + client totals | route | 2 |
| `src/context/TenantContext.jsx` (156-197) | `table_sessions` SELECT+INSERT | `POST /api/table-sessions`; store `capability_token` | route | 2 |
| `src/components/table/TableOrdersHistory.jsx` (31-46, 121-124) | embedded poller + unfiltered cancel UPDATE | poller → `GET /api/orders/my?capability=`; cancel → `POST /api/orders/:id/cancel` | route | 2 |
| `src/components/layout/CustomerMenuHeader.jsx` (30-36) | 15 s poller | `GET /api/orders/my?capability=` (same latest-non-cancelled/delivered filter) | route | 2 |
| `KitchenDashboard:50,95`; `ActiveOrdersPanel:48`; `OrdersManager:58,104`; `Dashboard:72`; `preBillService:15`; `WaiterDashboard:59`; `TablesGrid:49`; `CreateOrderModal:135-211`; `SuperAdminOrdersManager:59`; `SuperAdminTenantsManager:120`; `TenantTester:62` | direct reads/writes | **unchanged call shape** — ride claim RLS via attached JWT (staff/super) | supabase-js + claims | none (1 enables) |
| `src/App.jsx` (128-133), `ProtectedRoute.jsx` | `/waiter /garzon /kitchen /cocina` unprotected | wrap with `ProtectedRoute` + `requireRole` (`staff`/`waiter`/`kitchen`; super_admin allowed) | — | 3 |

## 7. File Changes

| File | Action | Split | Purpose |
|------|--------|-------|---------|
| `api/auth/token.js`, `api/middleware/requireAuth.js`, `api/orders.js`, `api/table-sessions.js`, `api/admin/users.js` | Create | 1 | JWT mint; session-verify helper; transactional orders + own-read + cancel; session create/resume; bcrypt user CRUD |
| `api/auth/session.js`, `api/auth/reset-password.js`, `api/middleware/rateLimit.js` | Modify | 1 | inline token; server-side reset token mint + rate keys (`auth/token`, `auth/reset-password/confirm`, `auth/reset-password/reset`, `orders`, `orders/my`, `table-sessions`, `admin/users`) |
| `database/server-order-functions.sql` | Create | 1 | `tappmesa_place_order` (invoker, service-role-only EXECUTE) + capability mint helpers (additive, no grants touched — dormant-safe) |
| `prisma/schema.prisma` (+migration) | Modify | 1 | orders `idempotency_key @unique`, `@@unique([order_number])`; table_sessions `capability_token @unique` |
| `package.json`, `.env.local.sample`, Vercel env | Modify | 1 | `jsonwebtoken`; `SUPABASE_JWT_SECRET` (server-only, never `VITE_`) |
| `src/lib/supabase.js`, `src/context/AuthContext.jsx`, `UsersManager.jsx`, `SystemUsersManager.jsx` | Modify | 1 | token attach/swap, C5, users via API |
| `src/lib/authService.js`, `src/middleware/tenantResolver.js` | Delete | 1 | dead code (verified zero importers) |
| `database/secure-data-access.sql`, `database/rollback-secure-data-access.sql` | Create | 2 | the one lockdown migration (single transaction) + reverse-DDL; archived originals of dropped fns under `database/archive/` |
| `database/{setup-rls,fix-rls-orders,fix-rls-tables,fix-tables-rls-tenant-isolation,fix-rls-customer-history}.sql`, `02-…SEGURO.sql` `USING(true)` blocks, `fix-reset-token-function.sql`, `add-qr-expiration.sql` | Archive/delete | 2 | superseded (keep `migrate-to-secure-auth.sql`, `functions.sql`, `add-missing-table-columns.sql`, `create-*`, `add-waiter-role.sql` — archived copies for rollback) |
| `CartContext.jsx`, `TenantContext.jsx`, `TableOrdersHistory.jsx`, `CustomerMenuHeader.jsx` | Modify | 2 | route flips (TableOrdersHistory edit-flow restored via gated cancel) |
| `src/App.jsx`, `src/components/ProtectedRoute.jsx` | Modify | 3 | staff route protection + role gate |

## 8. Testing & Verification

| Layer | Split 1 | Split 2 | Split 3 |
|---|---|---|---|
| Unit (Vitest) | route handlers w/ mocked supabase (`createMockSupabase` + mock `tappmesa_place_order`): token mint claims/exp/verify; `requireAuth` 401s; users scoping (tenant_admin vs super_admin, no `password_hash`); orders validation/idempotency/IVA; table-sessions resume/create; C5 (401 clears, 500/network keeps) | — | `ProtectedRoute` requireRole cases |
| Integration | local Supabase smoke: `supabase start` + `db reset` + `server-order-functions.sql`; curl: same `idempotency_key` ×2 → 1 order; takeout; session resume | `pg_policies` live-diff checklist (SQL asserts zero policies with bare `true` / `auth.uid()` / latch fns; named inventory absent incl. `tables_*_authenticated` all 4, `table_statuses_*_all`, loyalty 7, `*_tenant_*`); `pg_proc` asserts DROP targets gone; **anon-key matrix**: 0 rows on orders/order_items/table_sessions/customers/customer_order_history/table_statuses/admin_users/admin_sessions/password_reset_tokens; menu reads OK; **claim-token matrix**: staff own-tenant rows, cross-tenant 0 rows, super_admin cross-tenant OK; trigger smoke (staff `CreateOrderModal` insert → `stock_movements` created; service-role order → session totals updated) | guard tests |
| Regression | `pnpm test:run` | `pnpm test:run` + June-2026 fixes (bcrypt, kitchen scoping, getCustomerHistory) | `pnpm test:run` |
| E2E/manual | JWT-accepted-by-PostgREST test query before lockdown | day-of: flip checklist (anon no-JWT 0 rows; menu/table flow; "Mis Pedidos" pollers; double-submit single order) | unauth `/kitchen` redirect |

**Sequencing rule**: split 1 must be live + verified (routes + schema + token path) **before** split 2's migration commits — routes are additive/dormant-safe until then; split 3 depends only on `app_role` claims (1→3); 2 ∥ 3.

**Rollback** (split 2 critical): run `rollback-secure-data-access.sql` — drop claim helpers/policies, re-grant anon/authenticated per pre-flight snapshot (taken before apply), re-create archived functions/triggers from `database/archive/`; routes go dormant; old frontend redeploys cleanly (flip code retained as deploy artifact one release). Reversible: grants/policies/functions/triggers fully reversible; additive columns (`idempotency_key`, `capability_token`, unique indexes on new columns) are backward-compatible and kept.

## 9. Open Questions → Decisions

1. **SUPABASE_JWT_SECRET available?** → Assumed confirmed (user confirms before split-1 env setup; server-only, never `VITE_`). Blocker if absent.
2. **session.js inline vs separate token call?** → **Both**: inline in `session.js` (zero extra round-trip) + `/api/auth/token` as 401-refresh endpoint (C5).
3. **Capability: uuid vs opaque token?** → **Opaque HMAC** `capability_token` (D4); dual-mode accepts uuid during flip only.
4. **`POST /api/orders` transactional scope?** → **orders + order_items + session totals only**; stock/customer-history/loyalty effects stay in existing triggers (verified under both roles; loyalty trigger dropped).
5. **Loyalty: DROP vs defensive?** → **DROP** (D8) — zero live consumer, R2-2 class.
6. **`table_statuses` fns: REVOKE vs DROP?** → **DROP** (D9).
7. **Dynamic `%I_tenant_*` names?** → **Introspection-driven DO-block** over `pg_policies` (covers live-only residue) + explicit named list for review; cross-checked against pre-flight snapshot at apply.
8. **`get_top_products` inline vs defer?** → **Claim-guard inline in the migration** (D11) — deviation from proposal's "defer", justified: no anon PUBLIC SECURITY DEFINER may read order-derived data at the flip; route rewrite optional in split 3.
9. **`is_business_open` anon callers?** → **Zero verified** → `REVOKE EXECUTE FROM PUBLIC` (keep function dormant; future reservation use is staff/authenticated).
10. **Takeout (`table_session_id: null`)?** → **Route resolves tenant from Host subdomain** (D/§5); `table_session_id: null` accepted; no session required; existing cart takeout branch (`CartContext.jsx:212`) preserved — no split-1 regression.

## 10. Risks

| Risk | L | Mitigation |
|---|---|---|
| Lockout during flip (revoke before grants) | Med | one-transaction migration, order §4; verify matrix pre/post commit; staged rollback |
| R2-2 class (triggers on claim-only tables) | Med | loyalty dropped (same txn); `update_stock_after_order`/`update_customer_stats_after_order`/`clear_insecure_password` verified under service-role AND authenticated before apply; stock grants to authenticated in same migration (D13) |
| Policy-sweep gap (R2-4 class) | Med | introspection sweep + pre-flight `pg_policies` snapshot + verify assert (zero `true`/`auth.uid()` quals) |
| Live DB differs from repo (unversioned scripts) | High | worst-case re-apply; introspection; snapshot before apply |
| **Inventory gaps found vs proposal** | — | analytics DEFINER family PUBLIC execute (7 fns) → REVOKE + claim-guard get_top_products (D11); `tenantResolver.js` dead caller of `set_tenant_context` → deleted (D12); `role_permissions_all` `USING(true)` + `profiles` latch policies → introspected drop, server-only grants |
| Customer table-flow regression during flip | Med | routes live+verified before migration; frontend flips same release as migration; rollback restores instantly |
| Staff `CreateOrderModal` writes fail post-lockdown | Med | authenticated grants incl. stock_* ; trigger smoke test in split-2 verification |
| Capability in query string | Low | opaque 128-bit token, never published, rate-limited `orders/my` |
| `super_admin` cross-tenant regression | Med | `app_role` OR-branch + routes; validate list/create/switch scenarios |
| Reservations anon PII residual (existing behavior, out of scope) | Med | unchanged `status='confirmed'` scoping; flagged for follow-up change |
| custom JWT rejected by PostgREST | Low | mechanism verified; test-token query pre-lockdown (split-1 verification) |

## 11. Split Alignment Summary (review-size)

| Split | Scope | Est. lines | Components |
|---|---|---|---|
| 1 `server-data-routes` | JWT mint + requireAuth; orders/table-sessions/my/cancel routes; users API (C3); reset hardening (C2); C5; schema (idempotency/capability); `tappmesa_place_order`; AuthContext/UsersManager flips; dead-code deletion | ~1,050-1,350 | all api/* new/mod routes, `server-order-functions.sql`, prisma, supabase.js, AuthContext, UsersManager, SystemUsersManager, authService/tenantResolver deletions, rateLimit, env |
| 2 `rls-lockdown-flip` | ONE migration (revoke→grants→claim policies→neutralizations→complete sweep incl. R2-4/api-first gaps); customer route flips (Cart, Tenant, TableOrdersHistory, CustomerMenuHeader); script archiving; day-of apply + verification | ~900-1,200 | `secure-data-access.sql` + rollback + archive; 4 frontend flips; inventory deletes |
| 3 `route-hardening` | ProtectedRoute + role gates on 4 staff routes; optional get_top_products route rewrite | ~250-400 | App.jsx, ProtectedRoute.jsx |
**Do NOT collapse** — the additive-vs-flip boundary is what keeps the security diff reviewable (R2-4-class slips happen in oversized reviews). Sequential dependency 1→2; 1→3; 2∥3.

## 12. Security Review Checklist (sdd-verify)

- [ ] Anon no-JWT reads 0 rows on `orders`, `order_items`, `table_sessions`, `customers`, `customer_order_history`, `table_statuses`, `admin_*`, `password_reset_tokens`; menu/table reads OK; zero `USING(true)` / `auth.uid()` / latch policies remain (`pg_policies` SQL assert); `tables_{select,insert,update,delete}_authenticated`, `table_statuses_*_all`, loyalty 7, `*_tenant_*` gone; DROP-fn targets absent from `pg_proc`; all SECURITY DEFINERs PUBLIC-execute-revoked (get_top_products claim-guarded + authenticated-granted)
- [ ] `generate_password_reset_token` dropped; `password_reset_tokens` RLS + zero policies; route-minted tokens only
- [ ] No plaintext: `password_hash` starts `$2` after UsersManager create; route responses lack the key
- [ ] Double-submit (same `idempotency_key`) → exactly 1 order; unique `order_number`; totals = server IVA; takeout works; cancel foreign/mismatched session affects 0 rows; `GET /api/orders/my` unknown → 200 `[]`
- [ ] Cross-tenant claim (tenant A JWT → tenant B row) affects 0 rows incl. staff `CreateOrderModal` (triggers verified)
- [ ] `getCurrentSession` clears only on 401; `authService.js`/`tenantResolver.js` gone, no dangling imports
- [ ] Unauthenticated `/kitchen /waiter /cocina /garzon` redirect to login
- [ ] `super_admin` list/switch works (SystemUsersManager, SuperAdmin context)
- [ ] No custom headers anywhere (R2-5); `SUPABASE_JWT_SECRET` never client-side; `pnpm test:run` green; June-2026 fixes not regressed

## 13. Accepted Risks (deferred — register + address at end of program)

**User decision (2026-08-18):** risks accepted in Judgment Day R1 on design v2 are REGISTERED here and will be ADDRESSED at the end of the fix program (after splits 1-3 ship). Do not silently drop them; each requires an explicit follow-up task/PR.

### CRITICAL (accepted, single-judge suspect — must be closed later)
- **S-A1 · `POST /api/table-sessions` PUBLIC route capability enumeration.** Route accepts `{table_id, tenant_id}` from any anon, `tables` is anon-SELECTable (id/unique_code exposed) → any anonymous user can enumerate tables, mint a capability for a live session, and read/cancel that session's orders cross-tenant. Re-opens the R2-1/R2-3 class the design claims to eliminate ("uuid never published" contradiction). Dual-mode raw-uuid acceptance widens it during the flip. **Deferred fix:** resolve table by server-side `unique_code` (physical gate, as today TenantContext.jsx:106-112), never answer anonymous table-session resume with capability minting; bind capability to tenant + session and single-use; kill raw-uuid dual-mode after flip.

### WARNING (accepted as implementation notes — verify/close in splits)
- **S-A2 · `POST /api/orders` input contract omits `estimated_time` / `table_number`** → regression vs CartContext.jsx:204-221 (UIs render estimates: TableOrdersHistory.jsx:216, CustomerMenuHeader.jsx:45-50).
- **S-A3 · `reservations` missing from authenticated claim-grant set** → staff reservation reads (supabase.js:606-694) break post-flip.
- **S-A4 · anon reservations `status='confirmed'` scoping breaks `getTableAvailability`** (supabase.js:620-626 filters `.neq('status','cancelled')`) → double-booking risk.
- **S-B3 · RLS never `ENABLE`d on `pre_bills` / `surveys` / `tenant_subscriptions`** → claim grants+policies over RLS-off = cross-tenant read/write bypass.
- **S-B4 · `SuperAdminTenantsManager.jsx:114` reads `admin_users` client-side** → post-flip zero grants → user counts silently 0.
- **S-B5 · `update_customer_stats_after_order` `ON CONFLICT (phone)` vs Prisma `@@unique([tenant_id, phone])`** → 42704 aborts staff UPDATE (pre-existing; keep+verify must handle).

### INFO (decouple later)
- **D4 capability HMAC keyed on `SUPABASE_JWT_SECRET`** → rotating the secret invalidates live capabilities; use per-session random key or separate capability secret.
- **Takeout tenant resolved from Host header** → non-browser clients can pollute orders into any tenant's tables (bounded: rate-limited, no read path; accepted residual until per-tenant takeout capability).