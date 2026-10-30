# Analytics dashboard

Objective: replace the stock copy at `/admin/analytics` with real per-tenant analytics, computed in SQL, for tenant admins and the super admin.
Branches: `feat/analytics-sql` (T1), `feat/analytics-ui` (T2). Delivery: one PR per task. Runners: Vitest (`npm run test:run`), SQL gates via `psql -f scripts/verify-analytics.sql` against a lab/local Postgres.

## Specs

- S1: "La convertimos en analíticas de verdad, la idea es que se pueda hacer eso, ver numeros flujos de cada local, recuerda que eso tambien debe estar disponible para el tenant y para el superusuario". Tenant admin sees its own local; super admin picks one local or "all locals".
- S2: "veamos eso como una funcion sql, porque en el navegador se va a poner pesado, muy rapido". One function `get_analytics(p_tenant_id uuid, p_from timestamptz, p_to timestamptz)` returns one `jsonb` with every section. `p_tenant_id = null` means all locals.
- S3: Security (approved proposal). `SECURITY INVOKER`, so the existing RLS keeps scoping rows. Only `tenant_admin` and `super_admin` may call it; a tenant asking for `null` or another tenant's id gets `forbidden`.
- S4: Metrics (approved proposal). Days and hours are bucketed in `America/Santiago`. Sales = sum of `total` of `delivered` orders; orders = count of `delivered`; average ticket = sales / orders; cancellation rate = `cancelled` / all orders in the period; comparison with the previous period of equal length; daily series including zero days; hourly flow 0-23; in-progress counts (`pending`, `preparing`, `ready`) independent of the period; top 10 products (units, revenue); by category; by `table_number` (no table = "Sin mesa"); locals ranking only for `null` (sales, orders, ticket, cancellation per local).
- S5: Index `orders(tenant_id, created_at)` for range filters.
- S6: Delivery in two PRs: (1) SQL file + `GRANT` to `authenticated` + index + verification script; applied to production only with the user's authorization. (2) Frontend: replace `Analytics.jsx` with the dashboard (`recharts`, period selector, local selector for super admin) and tests; the duplicated stock screen leaves that route.

## Tasks

| ID | Specs | Route | Status | Evidence |
|----|-------|-------|--------|----------|
| T1 | S2-S5, S6(1) | inline | done, PR #220; prod apply pending authorization | 36f7e388 + correction commit |
| T2 | S1, S6(2) | inline | pending | |

## Log

- L1 (2026-10-30): "La convertimos en analíticas de verdad, la idea es que se pueda hacer eso, ver numeros flujos de cada local, recuerda que eso tambien debe estar disponible para el tenant y para el superusuario"
- L2 (2026-10-30): "dale, espero la propuesta de métricas, pero veamos eso como una funcion sql, porque en el navegador se va a poner pesado, muy rapido y prefiero abordarlo y resolverlo desde ya"
- L3 (2026-10-30): "si, me parece bien la propuesta, procede" — approves the metrics table and SECURITY INVOKER.
- L4: Mapping: admin screens read via the reassignable `supabase` client with the custom JWT (`app_tenant_id`, `app_role`); RLS `orders_claim` = own tenant OR `app_is_super_admin()`. No code sets `completed`; realized sales are `delivered`. Orders have no `table_id`/payment/order_type columns. Only `(tenant_id, status)` index exists on orders; order_items has no `order_id` index in the Prisma schema.
- L5: Decision: KPIs, daily series and hourly flow all count `delivered` orders so the numbers agree; open orders show in "in progress". Ranges are half-open `[p_from, p_to)`.
- L6: T1 (36f7e388, PR #220): local Postgres 17 gates RED -> GREEN -> rollback RED -> idempotent; mutation (count non-delivered) caught by B1_daily/B1_hourly/B1_tables. Branch had been created on top of another session's `chore/deps-batch` commit; rebased onto main.
- L7: Independent verifier: PASS on S2-S6(1), no blockers. Advisories fixed in a correction commit with RED gates first: daily series depended on session TimeZone across DST (B4), ties now broken by id (B3), `-v lab=0` no longer runs PART B. Left as is: unbounded range (statement timeout bounds it), all-locals 1-year ~0.8 s at 50k orders (RLS per-item check), previous period not aligned to local midnight across DST. T2 must label `table_number: null` as "Sin mesa" and `name: null` products.
