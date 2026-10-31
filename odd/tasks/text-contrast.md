# Text contrast and brand colors

Objective: text on light surfaces meets WCAG AA (4.5:1) and brand fallbacks use the theme palette, one screen group per PR.
Branch per slice off `main` · Delivery: one PR per task · Test runner: Vitest (`npm run test:run`).

## Specs

- S1 (L1): "terminemos lo del diseño, paleta de colores y todo ello" — UX audit item 1, contrast/colors, "por grupos de pantallas" like the button adoption.
- S2: On light surfaces `text-gray-400` (2.54:1 on white) becomes `text-gray-500` (4.83:1 on white, 4.63:1 on gray-50). Where the surface is gray-100 or darker gray (gray-500 is 4.39:1 on gray-100), use `text-gray-600`.
- S3: On dark surfaces (`bg-gray-800`/`bg-gray-900`, e.g. the landing footer) `text-gray-400` stays: it is 5.78:1 / 6.99:1 there, and gray-500 would fail (3.04:1).
- S4: Hover feedback is kept: a `hover:text-gray-500` paired with gray-400 becomes `hover:text-gray-700`.
- S5: Brand fallbacks that hard-code the old red/orange (`#dc2626`, `#f97316`) use the theme palette (`primary-500` #8b5e3c, `secondary-500` #6b8263).
- S6: Exceptions kept as hex: table status colors (user-chosen data saved to the DB) and the analytics chart chrome (Recharts props need concrete colors).
- S7: Each slice: a contract test listing the migrated files (RED first), full suite, lint, build. The last slice turns it into a guard over all of `src`.

## Tasks

| ID | Screens | Uses | Specs | Route | Status | Commit |
|---|---|---|---|---|---|---|
| T1 | Customer and staff: menu, cart, table, reservations, login, register, contact sales, waiter, kitchen | 31 | S2-S4, S7 | inline | done | 01384031 (#228) |
| T2 | Tenant admin managers, AdminApp | 55 | S2-S4, S7 | inline | done | (this PR) |
| T3 | Super admin managers, SystemUsersManager, SubscriptionPlansManager | ~53 | S2-S4, S7 | inline | pending | |
| T4 | Brand fallbacks (Settings, MenuCard, FloatingCartButton) + global guard | 5 | S3, S5-S7 | inline | pending | |

## Log

- L1 (2026-10-30): "no veo mas errores, hasta ahora terminemos lo del diseño, paleta de colores y todo ello, que estabamos viendo o lo que nos quede sin cerrar" — then "si, tambien veamos esto" and "listo, mergeados, sigue con contraste y colores".
- L2: Inventory on main d2515e16: 158 `text-gray-400` in 38 files; 19 in `Landing/v2/Footer.jsx` on `bg-gray-900` (S3, kept). 21 hex in JSX: 12 table-status data and 4 chart chrome (S6), 5 brand fallbacks (S5). Contrast ratios computed with the WCAG formula. No writer delegation: slices are small and mechanical.
- L3: T1: all 31 uses sit on white surfaces (mostly decorative input and empty-state icons, the register stepper and a disabled back button) → gray-500. RED 13/13 → GREEN; suite 443/443, lint, build OK.
- L4: T2: 55 uses. The product image placeholder sits on bg-gray-100 → gray-600 (S2); AdminApp logout hover gray-500 → gray-700 (S4); the rest on white → gray-500. RED 14/14 → GREEN; suite 470/470, lint, build OK.
