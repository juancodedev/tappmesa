# Proposal: Call Waiter Button (customer table flow)

**Status**: Proposal — open questions resolved on 2026-11-02 (see "Decisions"). Captured on 2026-10-28 during the table-flow UX pass (`fix/table-flow-ux`). Requires the SDD phases (spec → design → tasks) before any implementation.

## Delivery Plan

- **Delivery 1 — Waiter calls**: customer button with reasons, tenant toggle, staff list updated via Supabase Realtime on the waiter dashboard and the admin panel.
- **Delivery 2 — Staff PWA + Web Push**: installable PWA (manifest + service worker) for staff, Web Push notifications sent to every waiter and admin of the tenant when a call is created. No sound alerts.

## Intent

A customer seated at a table (QR flow, `/:slug/:table`) has no way to request attention other than physically flagging staff. Ordering is digital, but asking for the bill, extra cutlery, or help still depends on eye contact. A "Call waiter" button lets the customer send a request from the table menu, and lets waiters see pending requests per table on their dashboard.

## Scope

### In Scope

- Customer-facing "Llamar al mesero" button in the table flow (`TableApp`), visible only when a valid table session exists.
- Request reasons (single choice, optional): `assistance` (default), `bill`, `other`.
- Server route to create and cancel a request, scoped by the table session capability.
- Waiter dashboard (`/waiter`, `/garzon`) and admin panel: list of pending requests per table, with an "Attended" action.
- Customer feedback for the request lifecycle: sent → attended, and cancel while pending.
- Per-tenant setting to enable or disable the feature (Delivery 1).
- Supabase Realtime updates for the staff request list (Delivery 1).
- Staff PWA and Web Push notifications to all waiters and admins of the tenant (Delivery 2).

### Out of Scope

- SMS or sound alerts on staff devices.
- Assigning requests or tables to a specific waiter: every waiter and admin of the tenant is notified; the admin directs staff physically. Assignment rules need business discovery first.
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

## Decisions (2026-11-02)

1. "Pedir la cuenta" is the `bill` reason of this request, not a separate `pre_bills` flow: the waiter arrives bringing the bill.
2. The feature is configurable per tenant (can be disabled, for example in counter-service cafes).
3. The 30-second polling of the waiter dashboard is too slow and only works with the screen open: Delivery 1 uses Supabase Realtime; Delivery 2 adds Web Push so staff are notified with the app closed. iOS requires the PWA installed on the home screen (iOS 16.4+).
4. Unattended pending requests expire after 5 minutes (`status = 'expired'`), so the customer can call again.

## Data Model (draft, to be confirmed in design)

`waiter_calls`: `id`, `tenant_id`, `table_id`, `table_session_id`, `reason`, `status` (`pending` | `attended` | `cancelled` | `expired`), `created_at`, `resolved_at`, `resolved_by` (admin_users.id). Partial unique index on (`table_session_id`) WHERE `status = 'pending'` enforces R2.
