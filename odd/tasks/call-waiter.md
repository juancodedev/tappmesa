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
| T1 | S4-S7, S10 | inline | pending | — |
| T2 | S2, S4-S7, S10 | inline | pending | — |
| T3 | S9, S10 | inline | pending | — |
| T4 | S1-S3, S6, S7 | inline | pending | — |
| T5 | S7-S9 | inline | pending | — |

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
