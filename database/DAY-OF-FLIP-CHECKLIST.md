# SEC-005 — Day-of Flip Checklist (split 2 · rls-lockdown-flip)

> SDD change: `fix-critical-security-posture` · split 2 · gate 2.8 (tasks.md line 63).
> This is the runnable day-of procedure for applying `database/secure-data-access.sql`
> to a live Supabase project and proving the lockdown BEFORE the customer-facing
> flows depend on it. Every step is either a command or a pass/fail observation.
>
> Run the PRE steps (0-2) on the **current live state**, then APPLY, then run the
> POST steps (3-8). If any POST step fails, execute ROLLBACK (step 9) immediately.
>
> One-transaction guarantee: `secure-data-access.sql` is `BEGIN; ... COMMIT;` —
> a failed apply leaves the live DB untouched.

## 0. Prerequisites

| Item | Value / command |
|---|---|
| Supabase project URL | `SUPABASE_URL` env |
| Service role key | `SUPABASE_SERVICE_ROLE_KEY` env (apply + seed steps only) |
| JWT secret | `SUPABASE_JWT_SECRET` env (= project JWT secret; NEVER in client env) |
| psql access | project SQL editor (part A) or `psql "$DATABASE_URL"` |
| Pre-flight snapshot (REQUIRED before apply) | `SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname;` — save the output; it is the rollback reference (step 9). |

## 1. PRE — PostgREST test-token baseline (gate 1.14 / SEC-001 scenario)

Proves the server-minted HS256 JWT is accepted by live PostgREST **before** the
lockdown changes RLS:

```bash
SUPABASE_URL="$SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
SUPABASE_JWT_SECRET="$SUPABASE_JWT_SECRET" \
node scripts/postgrest-test-token-baseline.cjs orders
```

- PASS = exit 0 + `[baseline] SUCCESS — token accepted by PostgREST`.
- Record the row count and the `Data:` output here: `________`
- Also record `orders` limit-1 as the baseline shape; re-run the same command
  verbatim after apply to compare (staff claim `app_tenant_id` placeholder → the
  claim policy must return the same rows or fewer, never more).

## 2. PRE — anon no-JWT reads (current legacy state, for contrast)

```sql
-- SQL editor (anon role in Supabase = the key the browser already ships)
select count(*) from orders;                -- today: nonzero (legacy USING(true))
select count(*) from table_sessions;        -- today: nonzero (R2-1/R2-3 vector)
```
Record current counts: orders `____`, table_sessions `____` (expected: >0 today).

## 3. APPLY — the lockdown migration

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/secure-data-access.sql
```
(SQL editor: paste the file contents and run. One transaction.)

Expected NOTICEs: `secure-data-access: dropped N legacy policies (introspective sweep)`.

## 4. POST — static verify gates (prod-safe; run in SQL editor or psql)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/verify-rls-lockdown.sql
```
**PART A ONLY against production** — the file stops at a banner before PART B
(lab-only functional seed). PASS = final `RAISE NOTICE 'ALL VERIFY GATES PASSED (N)'`.

- A1 zero bare-`true` quals · A2 zero latch/`auth.uid()` quals · A3 named
  inventory absent (incl. `tables_{select,insert,update,delete}_authenticated` ×4,
  `table_statuses_*_all`, loyalty 7 quoted names) · A3b zero `*_all` · A4/A4b zero
  `*_tenant_*` · A5 DROP-fn targets absent from `pg_proc` (latch 5,
  `generate_password_reset_token`, `is_qr_code_expired`, `regenerate_table_qr_code`,
  `update_table_status`, `get_next_table_status`, `add_loyalty_points_on_order`) ·
  A6 claim helpers present · A7 claim policies on 15 claim tables · A8 anon denied
  on claim+server tables + menu grants OK + authenticated claim grants · A9
  analytics PUBLIC EXECUTE revoked + `get_top_products` authenticated-granted ·
  A10 RLS enabled on locked tables · A11 3 keep-triggers present + loyalty trigger
  absent.

Functional matrices (**PART B — lab clone / `supabase local` ONLY**, never prod):
B1 anon 0-rows matrix (incl. `stock_*`), B3 staff own-tenant exact counts, B3b
staff cross-tenant 0 rows, B4 super_admin cross-tenant OK (3 orders / 2 products),
B5 staff write + trigger smoke (`update_stock_after_order` → `stock_movements`
row + stock 10→8).

## 5. POST — re-run the test-token baseline (JWT survives the lockdown)

```bash
# same command as step 1
SUPABASE_URL="$SUPABASE_URL" \
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
SUPABASE_JWT_SECRET="$SUPABASE_JWT_SECRET" \
node scripts/postgrest-test-token-baseline.cjs orders
```
PASS = exit 0, row count <= baseline from step 1. Also re-run with an explicit
cross-tenant table to confirm claim scoping is live:
```bash
node scripts/postgrest-test-token-baseline.cjs table_sessions   # staff claim → own-tenant only / 0 rows
```

## 6. POST — anon no-JWT reads 0 rows (browser = anon key, no JWT)

```sql
-- SQL editor, anon key (no Authorization header)
select count(*) from orders;                -- MUST be 0 or permission error
select count(*) from order_items;           -- 0 / error
select count(*) from table_sessions;        -- 0 / error
select count(*) from customers;             -- 0 / error
select count(*) from customer_order_history;-- 0 / error
select count(*) from table_statuses;        -- 0 / error
select count(*) from admin_users;           -- 0 / error
select count(*) from admin_sessions;        -- 0 / error
select count(*) from password_reset_tokens; -- 0 / error
select count(*) from tenant_settings;       -- 0 / error
select count(*) from stock_inventory;       -- 0 / error
-- menu reads MUST still work:
select count(*) from tenants;               -- > 0 (public menu lookup)
select count(*) from products;              -- > 0
select count(*) from categories;            -- > 0
select count(*) from tables;                -- > 0 (unique_code lookup)
```

## 7. POST — app smoke (flipped build on the deployed DB)

- **Menu/table flow**: open `https://<tenant>-tappmesa.vercel.app/<TABLECODE>/menu`
  → menu renders, table session created via `POST /api/table-sessions`
  (`capability_token` in the response), no direct `table_sessions` RLS reads.
- **"Mis Pedidos" pollers**: `TableOrdersHistory` + `CustomerMenuHeader` poll
  `GET /api/orders/my?capability=…` — orders render with embedded
  `order_items → products` within 30s / 15s polling.
- **Double-submit single order**: open two tabs with the same table session,
  submit the same cart in both → EXACTLY 1 order (same `idempotency_key`,
  `ON CONFLICT DO NOTHING` replay); `order_number` rendered once; session
  `total_orders` increments once.
- **Cancel path**: edit/cancel a `pending` order → `POST /api/orders/:id/cancel`
  returns the order with `status='cancelled'`; a foreign order returns
  `{ cancelled: false }` (0 rows, no oracle).
- **Staff dashboard**: staff login → JWT attach (`tappmesa-jwt`) → claim-scoped
  reads/writes work (orders, stock, session totals via `CreateOrderModal`).

## 8. POST — regression suite

```bash
npm run test:run    # expect 19 files / 252 tests / exit 0
```

## 9. ROLLBACK path (if any POST step fails)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/rollback-secure-data-access.sql
# then re-apply the archived/kept legacy scripts (operator notes at the bottom of
# rollback-secure-data-access.sql):
#   psql -f database/archive/01-SETUP-ESENCIAL.sql
#   psql -f database/archive/02-SETUP-ESENCIAL-SEGURO.sql
#   psql -f database/archive/add-qr-expiration.sql
#   psql -f database/archive/setup-rls.sql
#   psql -f database/archive/fix-rls-orders.sql
#   psql -f database/archive/fix-rls-tables.sql
#   psql -f database/archive/fix-tables-rls-tenant-isolation.sql
#   psql -f database/archive/fix-rls-customer-history.sql
#   psql -f database/archive/fix-reset-token-function.sql
#   psql -f database/add-waiter-role.sql
#   psql -f database/create-table-statuses.sql
#   psql -f database/migrate-to-secure-auth.sql
#   psql -f database/create-loyalty-system.sql
#   psql -f database/functions.sql
```
Additive columns (`idempotency_key`, `capability_token`, unique indexes) are
backward-compatible and KEPT on rollback. The routes (split 1) go dormant again
(old frontend redeploys cleanly — flip code retained as a deploy artifact).

## Verification artifacts for gate 2.8

| Artifact | Purpose |
|---|---|
| `scripts/verify-rls-lockdown.sql` | SQL assert script: PART A static gates (prod-safe), PART B functional matrices (lab) |
| `scripts/postgrest-test-token-baseline.cjs` | PostgREST JWT acceptance baseline (pre + post apply) |
| `database/secure-data-access.sql` | The lockdown migration (one transaction) |
| `database/rollback-secure-data-access.sql` | Reverse DDL + operator rollback notes |
| `openspec/changes/fix-critical-security-posture/verify-report-split1.md` | S1 report + merged S2 gate 2.8 section |