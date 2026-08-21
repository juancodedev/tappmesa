# Tasks: Fix Critical Security Posture

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~2,200–2,950 total (S1 1,050–1,350 · S2 900–1,200 · S3 250–400; DEF tracked separately) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (S1) → PR2 (S2) → PR3 (S3), feature-branch-chain on tracker `feature/fix-critical-security-posture` |
| Delivery strategy | ask-always |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

| Split | Est. lines | Chained PR | 400-line risk | Decision needed before apply |
|---|---|---|---|---|
| 1 server-data-routes | 1,050–1,350 | Yes (PR1) | High | Yes |
| 2 rls-lockdown-flip | 900–1,200 | Yes (PR2) | High | Yes |
| 3 route-hardening | 250–400 | Yes (PR3) | Med | Yes |

### Suggested Work Units

| Unit | Goal | Likely PR | Base | Notes |
|---|---|---|---|---|
| 1 | S1 server data routes (additive, dormant-safe) | PR1 | feature/fix-critical-security-posture | tests+docs with code |
| 2 | S2 lockdown migration + customer flips | PR2 | PR1 branch | same release window as PR1 |
| 3 | S3 route hardening | PR3 | PR1 branch | S2 ∥ S3; independent |
| 4 | DEF follow-up registration | later | tracker/main | backlog only, no code |

## Dependency Graph

S2 blocks on S1 (SEC-005: migration commits ONLY after routes + token path + unique indexes live + verified — regression gate 1.14). S3 depends on S1 (`app_role` claims); S2 ∥ S3. DEF group runs after all splits.

## Split 1 — server-data-routes (test-first RED→GREEN per unit)

- [x] 1.1 prisma/schema.prisma: orders `idempotency_key @unique` + `@@unique([order_number])`; table_sessions `capability_token @unique`; generate migration.
- [x] 1.2 database/server-order-functions.sql: `tappmesa_place_order` (INVOKER, REVOKE PUBLIC EXECUTE, service-role only; prices from DB, IVA, order_number CSPRNG retry ×3, ON CONFLICT idempotency DO NOTHING) + capability HMAC helpers; tests.
- [x] 1.3 api/middleware/requireAuth.js: Bearer `tappmesa-session` → claim object (admin_sessions + admin_users); tests: 401 invalid/expired, claim shape.
- [x] 1.4 api/auth/token.js + api/auth/session.js inline `token`: HS256 JWT (exp−iat=3600, role authenticated, app_* claims, iss tappmesa-api); tests: claims, jwt.verify, customer flow mints none (SEC-001).
- [x] 1.5 src/lib/supabase.js: `export let supabase` + `setAccessToken(jwt)` (global.headers Authorization, zero call-site edits); getCurrentSession clears ONLY on 401 (C5); tests: 401 clears both keys, network/5xx keeps (C5-001).
- [x] 1.6 src/context/AuthContext.jsx: store `tappmesa-jwt` BEFORE SET_USER; silent refresh via /api/auth/token on 401; tests (SEC-002).
- [x] 1.7 api/orders.js: POST (capability or takeout Host resolution, `tappmesa_place_order`, 201/200 duplicate), GET /my?capability (200 [] unknown, 400 missing), POST /:id/cancel (foreign → 0 rows, cancelled:false); tests: double-submit, IVA, takeout, no-custom-headers (SEC-006/R2-5).
- [x] 1.8 api/table-sessions.js: verify tables row (tenant, is_active, qr not passed), resume/create, session_code, capability_token; tests: 201/200/400 expired.
- [x] 1.9 api/admin/users.js CRUD: bcrypt 12, tenant_id/role from claims (super_admin may set tenant_id), strip password_hash, audit rows; UsersManager.jsx/SystemUsersManager.jsx flips (remove plaintext 246-257); tests: $2 hash, no key in response, 403 escalation, 409 self-delete (ADM-001).
- [x] 1.10 api/auth/reset-password.js: server-minted `randomBytes(32)` 24h, delete previous; rate keys confirm/reset; tests (ADM-002).
- [x] 1.11 api/middleware/rateLimit.js: keys auth/token, orders, orders/my, table-sessions, admin/users; test 429 burst (RTE-006).
- [x] 1.12 package.json + .env.local.sample: jsonwebtoken; SUPABASE_JWT_SECRET server-only (never VITE_); SEC-007 client-bundle grep check.
- [x] 1.13 Delete src/lib/authService.js + src/middleware/tenantResolver.js (zero importers verified); import sweep; verify src/test/lib/authService.test.js still targets supabase.js's authService export.
- [x] 1.14 S1 verification: PostgREST test-token query pre-lockdown (SEC-001 scenario); `pnpm test:run` green; June-2026 fixes not regressed (design §12).

## Split 2 — rls-lockdown-flip (BLOCKS on 1.14 verified)

- [x] 2.1 database/secure-data-access.sql (ONE txn, order §4): introspective DROP sweep (bare true / auth.uid() / latch quals + named inventory incl. `tables_{select,insert,update,delete}_authenticated` ×4) → DROP fns (latch 5, reset-token, QR ×2, table_statuses ×2; loyalty trigger + fn) → REVOKE EXECUTE (analytics family; claim-guard `get_top_products`) → grants matrix (zero anon on claim tables; menu anon; stock_* TO authenticated) → `app_claim_tenant_id()` / `app_is_super_admin()` → claim policies (FOR ALL authenticated OR super_admin; reservations unchanged) → indexes confirm → COMMIT.
- [x] 2.2 database/rollback-secure-data-access.sql (reverse DDL) + pre-flight `pg_policies` snapshot step; archive dropped fns under database/archive/.
- [x] 2.3 Delete/archive superseded scripts: setup-rls, fix-rls-orders, fix-rls-tables, fix-tables-rls-tenant-isolation, fix-rls-customer-history, 01/02-SEGURO `USING(true)` blocks, fix-reset-token-function.sql, add-qr-expiration.sql; keep migrate-to-secure-auth.sql + functions.sql.
- [x] 2.4 CartContext.jsx: placeOrder → POST /api/orders (drop client order_number count + client totals); RE-ENABLE src/test/context/CartContext.test.jsx (remove vite.config.js exclude) + update tests (RLS-001).
- [x] 2.5 TenantContext.jsx: createOrResumeTableSession → POST /api/table-sessions (store capability_token); RE-ENABLE TenantContext.test.jsx + update tests.
- [x] 2.6 TableOrdersHistory.jsx: poller → GET /api/orders/my?capability; cancel → POST /:id/cancel; tests (drop-in shape, RTE-002).
- [x] 2.7 CustomerMenuHeader.jsx: poller → GET /api/orders/my?capability (latest-non-cancelled/delivered filter); tests.
- [x] 2.8 S2 verification (§12): `pg_policies` asserts (zero true/auth.uid()/latch quals; named inventory gone); `pg_proc` DROP targets absent; anon matrix 0 rows on orders/order_items/table_sessions/customers/customer_order_history/table_statuses/admin_*/password_reset_tokens; menu reads OK; claim matrix own-tenant rows / cross-tenant 0 / super_admin OK; trigger smoke (stock_movements, session totals); day-of flip checklist (SEC-005); `pnpm test:run` green.

## Split 3 — route-hardening (depends on S1 claims; 2 ∥ 3)

- [ ] 3.1 ProtectedRoute.jsx: `requireRole` (staff/waiter/kitchen, super_admin allowed); tests: unauth redirect, role allowed/denied (PRO-001).
- [ ] 3.2 App.jsx: wrap /waiter /garzon /kitchen /cocina with ProtectedRoute + requireRole (128-133).
- [ ] 3.3 S3 verification: unauth redirects to login, authorized renders, super_admin OK; `pnpm test:run` green.

## Deferred Follow-up Group (DEF — NOT in splits 1-3; own IDs)

- [ ] D1 Register DEF-001..DEF-007 in backlog/tracker (spec DEF section, design §13 S-A1..S-B5): enumeration closure, order input extension (estimated_time/table_number), reservations authenticated grants, getTableAvailability scoping, RLS on pre_bills/surveys/tenant_subscriptions, SuperAdminTenantsManager admin_users read, customer-stats ON CONFLICT.
- [ ] D2 Register INFO residuals: capability HMAC keyed on SUPABASE_JWT_SECRET (rotation), takeout Host-header pollution.
- [ ] D3 Track PRO-002 optional residuals (get_top_products route rewrite, polling→realtime, UX copy) — never prerequisites for splits 1-2.

## Commit Units (work-unit-commits; conventional, English, no Co-Authored-By)

- **S1**: `feat(api): mint JWTs with requireAuth middleware` · `feat(db): add idempotency_key, capability_token, unique order_number` · `feat(db): add tappmesa_place_order` · `feat(api): add transactional orders routes` · `feat(api): add table-sessions route` · `feat(api): add admin users CRUD with bcrypt` · `fix(api): harden password reset flow` · `fix(auth): clear session only on 401 and attach JWT` · `refactor: remove dead authService and tenantResolver` · `chore(deps): add jsonwebtoken, document SUPABASE_JWT_SECRET`
- **S2**: `feat(db): claim-scoped RLS lockdown with rollback` · `refactor(cart): place orders via server route` (+ re-enable test) · `refactor(tenant): create/resume sessions via route` (+ re-enable test) · `refactor(orders): poll and cancel via gated routes`
- **S3**: `feat(auth): protect staff routes with requireRole`
- **DEF**: `chore: register deferred security follow-ups` (backlog only)

## NOT NOW (do NOT fold into splits 1-3)

DEF-001 enumeration closure (S-A1) · DEF-002 order input extension (S-A2) · DEF-003 reservations grants (S-A3) · DEF-004 getTableAvailability (S-A4) · DEF-005 RLS on pre_bills/surveys/tenant_subscriptions (S-B3) · DEF-006 SuperAdminTenantsManager read (S-B4) · DEF-007 customer-stats ON CONFLICT (S-B5) · INFO: capability HMAC key rotation (D4), takeout Host pollution. Sources: spec.md DEF section, design.md §13; optional residuals per PRO-002.
