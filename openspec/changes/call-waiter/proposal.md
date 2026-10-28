# Proposal: Call Waiter Button (customer table flow)

**Status**: Backlog — spec only, not scheduled. Captured on 2026-10-28 during the table-flow UX pass (`fix/table-flow-ux`). Requires the SDD phases (spec → design → tasks) before any implementation.

## Intent

A customer seated at a table (QR flow, `/:slug/:table`) has no way to request attention other than physically flagging staff. Ordering is digital, but asking for the bill, extra cutlery, or help still depends on eye contact. A "Call waiter" button lets the customer send a request from the table menu, and lets waiters see pending requests per table on their dashboard.

## Scope

### In Scope

- Customer-facing "Llamar al mesero" button in the table flow (`TableApp`), visible only when a valid table session exists.
- Request reasons (single choice, optional): `assistance` (default), `bill`, `other`.
- Server route to create and cancel a request, scoped by the table session capability.
- Waiter dashboard (`/waiter`, `/garzon`): list of pending requests per table, with an "Attended" action.
- Customer feedback for the request lifecycle: sent → attended, and cancel while pending.

### Out of Scope

- Push notifications, SMS, or sound alerts on staff devices (follow-up).
- Realtime transport changes: the first version reuses the waiter dashboard's existing polling.
- Assigning requests to a specific waiter.
- Analytics on response times.

## Requirements

### R1: Customer can call a waiter from the table flow

The table flow SHALL render a "Llamar al mesero" button reachable from both the Menu and "Mis Pedidos" tabs, without covering the floating cart button or the fixed table info bar.

#### Scenario: Request sent

- GIVEN a customer with an active table session at table 4
- WHEN they tap "Llamar al mesero" and confirm the reason
- THEN a pending request for table 4 SHALL be created
- AND the button SHALL switch to a "Mesero en camino" pending state with a "Cancelar llamado" action
- AND the state change SHALL be announced to screen readers (`aria-live="polite"`)

#### Scenario: No active session

- GIVEN the table code is invalid or the session expired
- THEN the button SHALL NOT be rendered

### R2: One pending request per table session

The server SHALL keep at most one pending request per table session.

#### Scenario: Repeated taps

- GIVEN table 4 already has a pending request
- WHEN the customer taps the button again
- THEN no new request SHALL be created
- AND the customer SHALL see the existing pending state

### R3: Abuse protection

Request creation SHALL be rate limited per table session (proposed: max 1 new request per 60 seconds after a cancel or an attended request) using the existing rate limiter (`lib/middleware/rateLimit.js`).

### R4: Waiter sees and resolves requests

The waiter dashboard SHALL list pending requests for the waiter's tenant only, oldest first, showing table number, reason, and elapsed time. Marking a request "Atendido" SHALL resolve it, and the customer view SHALL reflect it on its next refresh.

#### Scenario: Cross-tenant isolation

- GIVEN a waiter of tenant A
- THEN requests from tenant B SHALL NOT be visible or resolvable

### R5: Security posture

The feature SHALL follow `openspec/changes/fix-critical-security-posture`: no anon table access. Customers create, read, and cancel requests only through server routes authorized by the table session capability; staff reads and writes use claim-scoped RLS (`app_tenant_id`, `app_role` in `waiter`/`admin`).

### R6: Accessibility and touch

The button and its actions SHALL meet the table-flow baseline: 44x44px minimum touch target, visible label (not icon-only), keyboard operable, and an accessible confirmation dialog that closes with Escape.

## Open Questions

1. Should "Pedir la cuenta" be a reason of this request or a separate flow tied to `pre_bills`?
2. Does the tenant need a setting to disable the feature (for example counter-service cafes)?
3. Is polling latency (current waiter dashboard interval) acceptable, or does v1 need Supabase Realtime?
4. Should requests auto-expire if not attended (proposed: 15 minutes)?

## Data Model (draft, to be confirmed in design)

`waiter_calls`: `id`, `tenant_id`, `table_id`, `table_session_id`, `reason`, `status` (`pending` | `attended` | `cancelled` | `expired`), `created_at`, `resolved_at`, `resolved_by` (admin_users.id). Partial unique index on (`table_session_id`) WHERE `status = 'pending'` enforces R2.
