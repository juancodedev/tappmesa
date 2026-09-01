---
schema: gentle-ai.verify-result/v1
change: fix-critical-security-posture
split: 1 (server-data-routes)
branch: fix/server-data-routes
head: a466f9c
base: a35fed8
verdict: PASS_WITH_FINDINGS
blockers:
  - none — no runtime blocker; CRITICAL-1 must be resolved before split 2 flips consumers (task 2.6)
critical_findings:
  - id: CRITICAL-1
    requirement: RTE-002
    summary: GET /api/orders/my returns flat orders without the embedded `order_items → products` shape the spec mandates ("identical to TableOrdersHistory.jsx:31-46"); the split-2 poller flip would NOT be drop-in.
requirements:
  SEC-001: PARTIAL
  SEC-002: COMPLIANT
  SEC-003: COMPLIANT
  SEC-004: COMPLIANT
  SEC-005: COMPLIANT
  SEC-006: PARTIAL
  SEC-007: COMPLIANT
  SEC-008: COMPLIANT
  RTE-001: PARTIAL
  RTE-002: FAILING
  RTE-003: PARTIAL
  RTE-004: COMPLIANT
  RTE-005: COMPLIANT
  RTE-006: PARTIAL
  ADM-001: COMPLIANT
  ADM-002: COMPLIANT
  C5-001: PARTIAL
test_command: pnpm test:run
test_exit_code: 0
test_output_hash: a971ba902e7d1da1
build_command: pnpm build
build_exit_code: 0
build_output_hash: cc1a19820003f068
lint_command: pnpm lint
lint_exit_code: 0
---

# Verify Report — Split 1 `server-data-routes` (fix-critical-security-posture)

## Scope

- **Diff**: `a35fed8..a466f9c` — 44 files, ~4.1k insertions / ~800 deletions (API server routes, DB migrations, client lib flips, tests).
- **Spec groups**: SEC-001..008, RTE-001..006, ADM-001..002, C5-001 (S1 portion; task 1.14 DB-side verification pending per tasks.md).
- **Excluded from verdict**: split-2 flip work (tasks 2.1-2.8), SQL lockdown, day-of flip checklist (SEC-005 gate held).

## Evidence collected

- Static review of every new/changed server file: `api/middleware/requireAuth.js`, `api/utils/jwt.js`, `api/auth/token.js`, `api/auth/session.js`, `api/orders.js`, `api/table-sessions.js`, `api/admin/users.js`, `api/auth/reset-password.js`, `api/middleware/rateLimit.js`, `api/utils/capability.js`, `api/utils/hostResolver.js`, `api/services/emailService.js`.
- DB migrations reviewed (additive/dormant confirmed): `add-idempotency-capability-columns.sql` (no RLS/grants), `server-order-functions.sql` (INVOKER, service-role EXECUTE only, IVA 19%, idempotent replay), `drop-public-reset-token-function.sql` (drop only).
- Client diffs: `src/lib/supabase.js` (export let + setAccessToken + 401-only clear), `AuthContext.jsx` (JWT before SET_USER), `UsersManager/SystemUsersManager` (API flips). No customer-flow files touched in this split (CartContext/TenantContext/TableOrdersHistory unchanged — dormant-safe guarantee verified via `git diff --stat`).
- SEC-007: `rg` over `dist/` → no `SUPABASE_JWT_SECRET` / `SUPABASE_SERVICE_ROLE` strings; no `VITE_`-prefixed secret in `.env.local.sample`; secret only read via `process.env` server-side (tests use `process.env` too).
- CORS-neutrality: `api/middleware/cors.js` untouched; no custom headers in any new route (standard `Authorization` + JSON bodies only).
- **Suites**: `pnpm test:run` → 13 files passed, 184 tests passed, duration 11.14s (exit 0). `pnpm lint` → 0 errors (1 pre-existing warning in `Analytics.jsx`, out of scope). `pnpm build` → success (exit 0, 1.32s).

## Compliance matrix

| Req | Status | Notes |
|---|---|---|
| SEC-001 | PARTIAL | JWT claim model correct (HS256, TTL 3600s, iss `tappmesa-api`, role `authenticated`, app_tenant_id/app_role/app_user_id; null tenant for super_admin). Response envelope missing `expires_at` (WARNING-1). Tests cover claims + tamper + TTL + customer flow mints none. |
| SEC-002 | COMPLIANT | `tappmesa-jwt` stored BEFORE `SET_USER` (AuthContext); `refreshJwt` on 401; getCurrentSession attaches token; tests cover store-before-set and silent refresh once. |
| SEC-003 | COMPLIANT | `export let supabase` + `setAccessToken(jwt)` with `global.headers` — ESM live bindings, zero call-site edits (verified: no `supabase.auth.` usage remains in src; ~40 importers unchanged). PostgREST-side JWT acceptance is DB verification deferred to task 1.14. |
| SEC-004 | COMPLIANT | Split 1 adds no anon grants/policies to orders/order_items/table_sessions; only additive columns + unique indexes. Dormant-safe verified. Enforcement lands in S2. |
| SEC-005 | COMPLIANT | Sequencing held: no consumer flipped to new routes in this split; task 1.14 (PostgREST pre-lockdown test-token) is unchecked, gating S2 — correct. |
| SEC-006 | PARTIAL | No custom headers anywhere (R2-5 met); BUT capability travels in `Authorization: Bearer` on POST /api/orders and cancel, while spec says "Capabilities MUST travel in body or query string" (WARNING-2). GET /my correctly uses query param. |
| SEC-007 | COMPLIANT | No secret in client bundle/src; `.env.local.sample` documents server-only secret; `getJwtSecret` refuses <16 chars with explicit "never VITE_" message. |
| SEC-008 | COMPLIANT | Super-admin preserved: app_tenant_id null in JWT, requireAuth passes tenant null, admin users route has super_admin branches; tests cover cross-tenant super_admin. |
| RTE-001 | PARTIAL | Transactional `tappmesa_place_order` (INVOKER, service-role only) with DB prices, 19% IVA, idempotency replay, 201/200 duplicate, session totals — all tested. Deviations: CSPRNG vs `random()` (WARNING-3), rate limit threshold (WARNING-6), input contract nested `customer` (WARNING-7). |
| RTE-002 | FAILING | CRITICAL-1: response omits embedded `order_items → products`; current consumers (TableOrdersHistory.jsx:31-46) read the embedded shape, so split-2's drop-in flip breaks. 400 missing-param and 200-[] no-oracle behaviors are correct and tested. |
| RTE-003 | PARTIAL | Ownership check + 0-rows + `{cancelled:false}` tested. Response missing `success` key vs spec `{success, cancelled}`; allowlist `['pending','preparing']` broader than spec `status='pending'` (WARNING-4). |
| RTE-004 | COMPLIANT | `ts_` + base64url(HMAC-SHA256(session_uuid, SUPABASE_JWT_SECRET, tag `tappmesa-capability-v1`)) exactly as spec'd; resume without insert; expired-QR 400; unique index; `session_code` `{code}-{ts36}`. Tests cover create/resume/expired/missing fields/405. |
| RTE-005 | COMPLIANT | Takeout tenant resolution from Host (`.tappmesa.vercel.app`, `.vercel.app`, `.tappmesa.com`, `.localhost`); 400 unresolvable; takeout branch tested. Cart takeout branch untouched (dormant-safe). |
| RTE-006 | PARTIAL | All listed routes rate-limited with keys (auth/token, reset-password/confirm, reset-password/reset, orders, orders/my, table-sessions, admin/users); 429 + retry-window tested. `orders` threshold 60/15min vs spec 30/min — control exists but is 4x laxer (WARNING-6). |
| ADM-001 | COMPLIANT | bcrypt 12 rounds server-side; tenant_id/role from claims (allowlist excl. super_admin for tenant_admin); super_admin may set tenant_id; `password_hash` stripped; per-tenant duplicate email; audit rows; 403/409/429 statuses; escalation attempts tested. |
| ADM-002 | COMPLIANT | Server-minted 32-byte tokens (crypto.randomBytes), 24h TTL, previous tokens invalidated; generic 200 (no email oracle); never calls the dropped public function; confirm/reset rate-limited. pg_proc absence verified at DB level in task 1.14. |
| C5-001 | PARTIAL | 401-only clear verified (network + 5xx keep storage — tested). `authenticatedFetch` (401→refresh→retry) has zero test coverage (WARNING-5). |

## Findings

### CRITICAL

| ID | Req | Finding |
|---|---|---|
| CRITICAL-1 | RTE-002 | `GET /api/orders/my` returns flat orders (`id, order_number, status, subtotal, tax, total, created_at`) with no `order_items → products` embedding. Spec (line 165) and design D5 mandate "embedded `order_items → products` shape (identical to `TableOrdersHistory.jsx:31-46`)". The S2 poller flip (task 2.6) would render order items missing. Resolve before S2 consumer flip (either embed via a second select in the route, or split-2 changes the component — the former matches the spec's drop-in intent). |

### WARNING

| ID | Req | Finding |
|---|---|---|
| WARNING-1 | SEC-001/002 | Response is `{token, claims:{exp}}` — missing `expires_at` and full claim set vs spec `{token, expires_at, claims}` (token.js + session.js). Client only consumes `token`/`exp` today, but the API contract deviates and would break documented consumers. |
| WARNING-2 | SEC-006 | Capability rides `Authorization: Bearer` on POST /api/orders and POST cancel; spec mandates body/query. CORS-neutrality (R2-5) still holds (standard header) but the channel contradicts the MUST and is inconsistent with GET /my. |
| WARNING-3 | RTE-001 | `order_number` generation uses SQL `random()` (pseudo-RNG) instead of the spec'd CSPRNG. Low practical impact (order_number is not secret, no read path by number), but letter-of-spec violation; SQL files carry an in-file justification. |
| WARNING-4 | RTE-003 | Cancel response omits `success` (`{cancelled:false}` / `{cancelled:true, order}` vs spec `{success, cancelled}`); cancel allowlist is `['pending','preparing']` vs spec `status='pending'`. Functional intent (foreign-session 0-rows no-oracle) holds. |
| WARNING-5 | C5-001 | `authenticatedFetch` (attach JWT → 401 → refresh once → retry → clear on second 401) is new security-critical client code with zero tests; `rg` finds no test importing it. |
| WARNING-6 | RTE-001/006 | `orders` rate limit is 60 per 15min window vs spec 30/min — 4x laxer; the RTE-006 scenario "exceeding the per-IP limit for orders (30/min)" is unsatisfiable at the documented threshold. |
| WARNING-7 | RTE-001 | Input contract drift: flat `customer_name`/`customer_phone` instead of nested `customer {name?, phone?}`; order-level `notes` not modeled. S2 CartContext flip must send the flat fields. |

### SUGGESTION

| ID | Req | Finding |
|---|---|---|
| SUGGESTION-1 | RTE-004 | `api/utils/capability.js` (ESM, `v1.cap.<payload>.<hmac>`) is not used by any production route (only tests import it); the minting route implements `ts_`+HMAC inline. Delete or align to avoid a second, misleading format + docs drift (`capability.js` is referenced by older notes/tests as "the" implementation). |
| SUGGESTION-2 | RTE-005 | Takeout resolution trusts any `Host` matching the suffix patterns; a non-browser client can send `Host: <victim>-tappmesa.vercel.app` to place takeout orders into another tenant. Accepted for S1 (rate-limited, single-route, no PII blast radius); flag for S3 route-hardening (e.g., signature/HMAC on takeout intent). |
| SUGGESTION-3 | SEC-001 | Degraded mode inconsistency: token.js returns 500 with clear message when SUPABASE_JWT_SECRET missing; session.js degrades to `{token:null}`. Intentional per `.env.local.sample` documentation, but consider aligning both behaviors for predictability. |

## Dormant-safe / additive guarantees (verified)

- `git diff a35fed8..a466f9c -- <customer flow files>` → empty: CartContext, TenantContext, TableOrdersHistory, CustomerMenuHeader, ProtectedRoute, App.jsx untouched.
- SQL migrations are additive (columns + unique indexes) or drop-only; zero changes to grants/RLS in this split — "No toca grants ni RLS (eso es split 2)" comment confirms.
- No client consumer was flipped to the new routes (SEC-005 held); new routes are live but unreferenced by app code until S2.
- `rg "supabase\.auth\."` in src → no matches: disabling GoTrue session lifecycle (persistSession/autoRefresh/detectSessionInUrl false) breaks nothing.

## Deferred to split 2 / DB-side (task 1.14)

- PostgREST test-token query pre-lockdown (SEC-001 scenario) — requires DB access; unchecked per tasks.md.
- `pg_proc` assert: `generate_password_reset_token` absent (ADM-002) — DB-side.
- RLS lockdown SQL, claim policies, DROP sweep, anon-matrix — all S2.

## Test/build/lint records

```
$ pnpm test:run            → 13 files passed, 184 tests passed, 11.14s (exit 0)
$ pnpm lint                → 0 errors, 1 pre-existing warning (Analytics.jsx, out of scope) (exit 0)
$ pnpm build               → vite build success, 1.32s (exit 0)
$ rg SUPABASE_JWT_SECRET dist/ → no matches (SEC-007)
```

---

# Gate 1.14 — S1 Verification Gate (2026-08-19) — MERGED

- **Verified HEAD**: `708eff4` (branch `fix/server-data-routes`, PR #180) — 12 commits past this report's original head `a466f9c`.
- **Verdict for gate 1.14**: **PASS**.
- **Prior findings resolution**: commits `e459f6d..708eff4` addressed CRITICAL-1 and WARNING-1..7 from the original report — re-verified in-tree at 708eff4:
  - **CRITICAL-1 (RTE-002) FIXED** — `api/orders.js:189-194` now selects `*, order_items(*, product:products(id, name, price, image_url))`, the embedded shape identical to `TableOrdersHistory.jsx:31-46` (drop-in poller flip for S2 task 2.6).
  - **WARNING-1 FIXED** — `api/auth/token.js` and `api/auth/session.js` (`session.js:42-45`) now return `{ token, expires_at (unix epoch, == claims.exp), claims }` per API contract.
  - WARNING-2 (capability moved to body/query, SEC-006) · WARNING-3 (order_number CSPRNG `gen_random_bytes`) · WARNING-4 (capability utils CJS, cancel allowlist) · WARNING-5 (`authenticatedFetch` test contract locked) · WARNING-6 (orders rate limit 30/min) · WARNING-7 (physical `table_number` stored) — all addressed by the post-report commits; C3 (legacy order_number dedupe) and C1/C2 (admin requireAuth client injection) also landed (`6bb03db`, `ae1e679`).

## Check 1 — PostgREST test-token query pre-lockdown (SEC-001 scenario)

No live Supabase connection string exists (no `.env.local`, no Supabase env vars in shell) → **baseline documented as prepared script/proof, per scope**; it is the SEC-005 day-of gate.

- **(a) Mint path produces claims exactly per SEC-001 — PROVEN at runtime** against the production module `api/utils/jwt.js` (`mintAdminJwt`, same code `api/auth/token.js`/`api/auth/session.js` use): HS256, `role: 'authenticated'`, `sub`, `app_tenant_id`, `app_role`, `app_user_id`, `exp - iat = 3600`, `iss: 'tappmesa-api'`, `jwt.verify` with `SUPABASE_JWT_SECRET` passes, super_admin → `app_tenant_id: null`. 10/10 checks true (`ALL_PASS: true`).
- **(b) Supabase client attaches via `setAccessToken` (global.headers Authorization) with zero call-site edits — PROVEN**: `src/lib/supabase.js:33-41` rebuilds the client with `global: { headers: { Authorization: Bearer <jwt> } }`; `export let supabase` live binding; 46 importer sites, zero direct `supabase =` reassignments outside `src/lib/supabase.js`. Runtime proof: the baseline script's request hit PostgREST-shaped endpoint as `GET /rest/v1/orders?select=id&limit=1` with `Authorization: Bearer eyJhbGciOiJIUzI1Ni...` (HS256 header visible).
- **(c) Test-token query prepared and documented** — new artifact `scripts/postgrest-test-token-baseline.cjs`: mints via production `mintAdminJwt`, attaches via the exact `setAccessToken` global.headers rebuild, runs `from('orders').select('id').limit(1)`. Proven end-to-end against a local PostgREST-shaped stub: exit 0, row returned. Without env vars it exits 2 with the documented "run at flip time" message. Usage: `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_JWT_SECRET=... node scripts/postgrest-test-token-baseline.cjs [table]`.

## Check 2 — Full suite green (exact counts)

```
$ npm run test:run         → 17 files passed, 220 tests passed, 11.93s (exit 0)
```

(vitest 4.1.0; the husky/pnpm-10 hook issue is bypassed by running `npm run test:run` directly, per the documented testing capability.) Suite grew from 13 files/184 tests at `a466f9c` to 17 files/220 tests at `708eff4` (new: `authenticatedFetch.test.js` + expanded token/session/jwt coverage from the finding-fix commits).

## Check 3 — June-2026 fixes not regressed (design §12)

All five regression surfaces verified — code inspection + the covering regression tests green:

- **bcrypt-only, no client-side hashing**: `api/auth/signin.js:61` `bcrypt.compare`, `api/auth/signup.js:105` `bcrypt.hash(password, saltRounds)` server-side; the client `hashPassword` stub (`supabase.js:224`) has **zero callers** and only emits the deprecation warning; `UsersManager.jsx` comments confirm server-side bcrypt 12.
- **Tenant-scoped updates**: `KitchenDashboard.jsx:69,100` `.eq('tenant_id', tenant.id)`; `getCustomerHistory(customerId, tenantId)` scoped `.eq('tenant_id', tenantId)` (`supabase.js:679,329`) — R1/R2 intact.
- **CSP security headers**: `vercel.json` carries `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
- **CSPRNG sessions**: `api/auth/signin.js:157` / `api/auth/signup.js:254` `crypto.getRandomValues(new Uint8Array(32))`.
- **`authService.js` / `tenantResolver.js` gone, no dangling imports**: both files absent; remaining `authService` references target the live export in `src/lib/supabase.js`; `src/test/lib/authService.test.js` imports `{ authService, supabase } from '../../lib/supabase'` (task 1.13 requirement met).
- **Covering regression tests green**: `authService.test.js`, `authenticatedFetch.test.js`, `token-route`, `session-route`, `requireAuth`, `jwt` → **6 files, 53 tests passed** (exit 0), embedded in the 17-file/220-test full run.

## Gate verdict

- **status: success**
- **Gate 1.14 → S2: PASS** — no blockers. Checkbox marked in `tasks.md` (line 52).
- Risks for S2 day-of: live PostgREST acceptance and `pg_proc` asserts (ADM-002) remain DB-side; run `scripts/postgrest-test-token-baseline.cjs` right before `secure-data-access.sql` (SEC-005 gate) and re-run after to confirm the JWT survives the lockdown.