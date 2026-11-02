# Call waiter — Delivery 1

Objective: a seated customer calls the waiter from the table flow; waiters and tenant admins see pending calls in real time and mark them attended. Source proposal: `openspec/changes/call-waiter/proposal.md`.
Branch `feature/call-waiter` · Delivery: ask-on-risk → feature-branch-chain (one PR per task into `feature/call-waiter`, then `feature/call-waiter` → `main`) · Test runner: Vitest (`npm run test:run`), plus `npm run lint` and `npm run build`.

## Specs

- S1 (L1): "desde el menu del cliente, se pueda hacer un llamado al garzon o mesero y que este vea una notificacion de esa llamada". The table flow (`TableApp`) shows a "Llamar al mesero" button, reachable from the Menu and "Mis Pedidos" tabs, only when a valid table session exists and the tenant has the feature enabled. It must not cover the floating cart button or the fixed table bar. Visible label, 44x44px minimum, keyboard operable.
- S2: Tapping the button opens an accessible dialog (closes with Escape) to pick a reason: `assistance` (default), `bill` ("Pedir la cuenta"), `other`. Confirming creates a pending call; the button switches to "Mesero en camino" with a "Cancelar llamado" action; state changes are announced with `aria-live="polite"`.
- S3 (L3): "si, con esa especificacion, para que llegue la cuenta con el mesero" — the `bill` reason only tells staff that the table asks for the bill; it does not create a `pre_bills` row (assumption A2).
- S4: At most one pending call per table session. Repeating the request while one is pending returns the existing pending call (no new row), including under concurrent requests.
- S5: After a call is cancelled or attended, a new call for the same table session is rejected for 60 seconds (enforced per table session, not per IP).
- S6 (L6): "dejemos en 5 minutos ese vencimiento, para pedir nuevamente otra vez al mesero" — a pending call not attended within 5 minutes becomes `expired`. The customer sees that nobody answered and can call again immediately; the 60-second rule does not apply after an expiry (assumption A1).
- S7 (L3): "¿Cada tenant puede desactivar la función?, si, es configurable" — a per-tenant setting `waiter_calls_enabled` (default on), editable by the tenant admin. When off, the button is hidden and the server rejects new calls; pending calls can still be attended (assumption A3).
- S8 (L5): "incluso para el admin, cosa que el pueda ver tambien notificaciones de mesa y pueda asignar o dirigir \"fisicamente\" esto" — pending calls are listed, oldest first, with table number, reason and elapsed time, on the waiter dashboard (`/waiter`, `/garzon`) and in the tenant admin panel. "Atendido" resolves the call; the customer view reflects it.
- S9 (L4, L5): updates reach staff screens through Supabase Realtime, not the 30-second polling. Every waiter and admin of the tenant sees every call (L4: "quizas por ahora solo enviar una notificacion a todos los meseros"); no assignment to a specific waiter.
- S10: Security (proposal R5): no anon access to `waiter_calls`. Customers create, read and cancel only through a server route authorized by the table-session capability, scoped to their own session. Staff read and resolve through claim-scoped RLS limited to their tenant and to roles `waiter`, `staff`, `tenant_admin` (plus `super_admin`); `kitchen` has no access. Tenant B calls are never visible or resolvable by tenant A.
- Out of scope (Delivery 2): staff PWA and Web Push. No sound alerts. No waiter assignment.

Assumptions (stated to the user 2026-11-02, not yet confirmed):
- A1: after an expiry the customer can call again immediately.
- A2: `bill` does not create a pre-bill.
- A3: disabling the feature blocks new calls; pending ones can still be attended.
- A4: the admin sees calls through a header badge with a dropdown list in `SecureAdminApp`, visible on every admin page.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S4-S7, S10 | inline | done, verified, reviewed | `cae4e5b0`, `44f429b1`, `8836c154` (branch `feature/call-waiter-t1-migration`) |
| T2 | S2, S4-S7, S10 | inline | done, verified, reviewed | `0986e435`, fix `c6490be9` (branch `feature/call-waiter-t2-api`; fix on t5) |
| T3 | S9, S10 | inline | done, verified, reviewed | `98c645c0`, fixes `c6490be9`, `19ac8a5f` (branch `feature/call-waiter-t3-realtime`; fixes on t5) |
| T4 | S1-S3, S6, S7 | inline | done, reviewed | `85e4e24a` (branch `feature/call-waiter-t4-customer`) |
| T5 | S7-S9 | inline | done, reviewed | `1d6581a7` (branch `feature/call-waiter-t5-staff`) |

- T1: migration `database/create-waiter-calls.sql` + rollback: `waiter_calls` table, `tenants.waiter_calls_enabled`, partial unique index, role-scoped RLS, realtime publication, create/expire DB function; static migration test. Risk: item 1, item 2.
- T2: `api/waiter-calls.js` (create, read, cancel by capability), shared capability lookup moved to `lib/`, `vercel.json` rewrite, route tests. Risk: item 2.
- T3: Realtime auth for the staff client (`realtime.setAuth` on token set/refresh) + `useWaiterCalls` hook (load + subscribe + resolve). Risk: item 2, item 3 (shared supabase client).
- T4: customer `CallWaiterButton` + dialog in `TableApp`; component tests.
- T5: staff `WaiterCallsPanel` on the waiter dashboard, admin header badge, toggle in `PreBillSettings`; component tests; docs (CLAUDE.md services note).

## Log

- L1 (2026-11-02): "teniamos algo pendiente sobre esto, lo cual implicaba una nueva funcion, que desde el menu del cliente, se pueda hacer un llamado al garzon o mesero y que este vea una notificacion de esa llamada"
- L2: found backlog proposal `openspec/changes/call-waiter/proposal.md` with 4 open questions.
- L3 (2026-11-02): "¿\"Pedir la cuenta\" es un motivo más del llamado o un flujo aparte ligado a pre_bills?, si, con esa especificacion, para que llegue la cuenta con el mesero / ¿Cada tenant puede desactivar la función?, si, es configurable / ¿Alcanza con la latencia del polling o la v1 necesita Supabase Realtime?, no entiendo esto"
- L4 (2026-11-02): "como, si es que se puede hacer, podriamos implementar notificaciones push, para el mesero?, creo que sonido ya es mucho ... quizas por ahora solo enviar una notificacion a todos los meseros, luego deberé entender el negocio y ahi ver que hacer con ese detalle"
- L5 (2026-11-02): "dale, vamos con las dos entregas / mi idea es que esto sea una pwa cosa de que se pueda usar con esas notificaciones, incluso para el admin, cosa que el pueda ver tambien notificaciones de mesa y pueda asignar o dirigir \"fisicamente\" esto y que el cliente no espere tanto"
- L6 (2026-11-02): "dejemos en 5 minutos ese vencimiento, para pedir nuevamente otra vez al mesero / me gusta la implementacion"
- L7 (2026-11-02): "si, haz commit y arranca con la entrega 1". Proposal committed `04e4eb6e`; review approved with 3 non-blocking advisories (lines 23-25, 85, 88), resolved as A1-A3.
- L8: exploration findings — capability `ts_` HMAC token resolved by `findSessionByCapability` (`api/orders.js:44-55`); rate limiter is per IP, so S5 is enforced in the DB; staff client sends JWT only via `global.headers`, so Realtime needs `realtime.setAuth`; RLS has no role filter today; `tenant_admin` cannot open `/waiter`; no scheduler exists, so expiry is lazy (on create/read).
- Forecast: ~1200 authored changed lines across T1-T5, over the 400-line slice budget.
- L9: chain strategy chosen by the user: feature-branch-chain.
- L10 T1: RED (missing migration) → GREEN 10/10 static tests. Runtime probes on Postgres 16 (Docker): anon denied on table and function; repeat returns same call; 8 parallel requests → 1 row; cooldown DETAIL 60 after attended; no cooldown after expiry; disabled → WAITER_CALLS_DISABLED; ended session → SESSION_NOT_ACTIVE; waiter A cannot read/resolve tenant B; kitchen sees 0; staff can only set status=attended; resolved_by stamped from claim; migration re-runnable; rollback clean. Independent verifier: PASS S4-S7, S9, S10, no blockers. Advisory fixed in `44f429b1`: an expired-but-pending call is not attendable (RLS USING `expires_at > now()`); lab gates `scripts/verify-waiter-calls.sql` (FAIL before, PASS after, FAIL after rollback). Advisory for T5: `tenant_claim` on tenants has no role filter (pre-existing).
- L11 T2: RED (missing route) → GREEN 21 route tests; `findSessionByCapability` moved to `lib/utils/tableSession.js`, orders tests unchanged and green. T3: RED 2/4 (realtime auth) → GREEN; `useWaiterCalls` 8 tests. Suite 559/559, lint clean.
- L12 T2+T3 independent verifier: PASS S2, S4-S7, S9, S10, no blockers; `/api/orders` differential check identical (201/200/200 valid, 401/200/401 unknown and closed). Advisories fixed in `6cbfa734` with RED→GREEN tests: non-uuid cancel id answers `{cancelled:false}` instead of 500; `realtime.setAuth` rejection is caught; a slow load of a previous tenant is dropped.
- L13 T4: RED (missing component) → GREEN 9 component tests + 2 TableApp integration tests; button in the sticky header (both tabs, clear of cart and table bar), dialog with reasons, "Mesero en camino" / "Cancelar llamado", aria-live status, 10 s polling while pending, attended/expired messages. Constants in `src/utils/waiterCalls.js` (react-refresh lint rule).
- L14 T5: RED → GREEN 8 staff component tests + 2 settings tests. `WaiterCallsList` (presentational) used by `WaiterCallsPanel` (waiter dashboard, above stats) and `WaiterCallsBell` (admin header, A4). Toggle "Permitir que los clientes llamen al mesero" in `PreBillSettings`. Two existing header tests now mock `useWaiterCalls`. CLAUDE.md documents the feature. Suite 583/583, lint clean, build OK.
- Follow-ups (not in scope): `tenant_claim` on `tenants` has no role filter, so any staff role with the table grant could change tenant settings (pre-existing, also affects tip/survey). Prisma models the partial indexes as full indexes (drift on `db pull`). Delivery 2 (staff PWA + Web Push) pending.
- Deploy order: apply `database/create-waiter-calls.sql` in Supabase BEFORE deploying the frontend; then run `psql -f scripts/verify-waiter-calls.sql` (PART A, prod-safe).
- L15 (2026-11-02): commit hashes above are after rebasing the chain on the T1 fix `8836c154`.
- L16 native review (RDD on, user granted each slice): T1 (base `04e4eb6e`, lenses risk/resilience/reliability) approved; T1-fix+T2 (base `44f429b1`, risk/reliability) approved; T3 (base `0986e435`, risk/resilience/reliability, escalated item 3) approved; T4+T5+fixes (base `98c645c0`, readability/reliability/resilience, escalated item 3) approved. All acknowledged.
- L17 review advisories acted on: lab harness `expect_error` swallowed its own failure and B8c was vacuous (fixed `8836c154`, proven: old migration fails B8d, harness self-test fails when no error is raised); malformed `app_user_id` claim no longer blocks attending (`8836c154`); failing client-change listener no longer breaks `setAccessToken`, hook settles `loading` without a client (`19ac8a5f`).
- Open follow-ups from the last review (non-blocking): a cancel error is not shown while the call is pending (`CallWaiterButton` renders the message only in the idle branch); `useResolveWaiterCall` keeps `resolvingId` if `resolve` throws; the admin bell hides load errors; Realtime events trigger a full reload each (no debounce).
- Deploy note (review R3/R4): `PreBillSettings` now saves `waiter_calls_enabled`, so saving pre-bill settings fails until `create-waiter-calls.sql` is applied. Apply the migration first.
- L18 (2026-11-02): the chain was merged bottom-up, so only T1 reached main via #244; T2-T5 landed through #250. Migration applied in production; PART A PASSED (run in the SQL Editor without psql meta-commands).
- L19 (2026-11-02, user: "dale, arranca con el PR de correcciones"): review follow-ups fixed on `fix/call-waiter-hardening`: cancel error shown while pending; stale status read cannot overwrite a newer call; `useResolveWaiterCall` frees the button when `resolve` throws; admin bell shows load errors; `useWaiterCalls` applies only the newest load. 5 RED tests first, then GREEN; suite 590/590, lint, build OK.
