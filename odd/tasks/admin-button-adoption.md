# Admin button adoption

Objective: replace hand-written `<button>` in admin/staff screens with `ui/Button`, one screen group per PR.
Branch per slice off `main` · Delivery: one PR per task · Test runner: Vitest (`npm run test:run`).

## Specs

- S1 (L1): "sigamos con los botones del admin" — after the table-flow slice (#211), migrate admin buttons "por parte".
- S2: Action buttons map to existing variants: primary actions `default`, destructive `destructive`, secondary `outline`, icon-only `ghost` + `size="icon"` with an accessible name (`aria-label`).
- S3: Tabs, toggles, segmented controls, list rows and custom-shaped controls keep their markup.
- S4: Behavior unchanged (handlers, disabled states, types); minimum 44px targets come from `Button` sizes.
- S5: Each slice: tests for the migrated screen's buttons (accessible names, variants), full suite, lint, build.

## Tasks

| ID | Screens | Buttons | Specs | Route | Status | Commit |
|---|---|---|---|---|---|---|
| T1 | ProductsManager, CategoriesManager | 17 | S2-S5 | inline | done | a17723d2 |
| T2 | TablesManager, TableStatusesManager, QRGenerator | 30 | S2-S5 | inline | done | e1b17140 |
| T3 | OrdersManager, ReservationsManager, CustomersManager | 26 | S2-S5 | inline | done | 4ae7cb88, d4a89c25 |
| T4 | StockManager, CompleteStockManager | 21 | S2-S5 | inline | pending | |
| T5 | UsersManager, Analytics, Settings, Dashboard, PreBillSettings, SecureAdminApp | 23 | S2-S5 | inline | pending | |
| T6 | Waiter (dashboard, CreateOrderModal, TablesGrid, ActiveOrdersPanel), KitchenDashboard | 25 | S2-S5 | inline | pending | |
| T7 | Super admin managers | 29 | S2-S5 | inline | pending | |

## Log

- L1 (2026-10-29): "ramas mezcladas, sigamos con los botones del admin" — previously agreed: "me gusta tu vision, avancemos asi, por parte" (table flow first, then admin per screen).
- L2: Inventory: 171 `<button>` in 32 files. No writer delegation: slices are small and sequential.
- L3: T1 done (a17723d2): RED 4/4 (missing classes and names) → GREEN; suite 342/342, lint, build OK. Delete-product button had no accessible name at all.
- L4: T2 done (e1b17140): RED 7/7 → GREEN; suite 349/349, lint, build OK. Kept per S3: actions dropdown items, inline "Actualizar" text links, color/icon pickers.
- L5: T3 done (4ae7cb88): RED 6/6 → GREEN; suite 355/355, lint, build OK. Decision: status-transition buttons keep their status color via className (staff map color to state); cancel uses `destructive`. Kept per S3: reservation filter tabs.
- L6: Found pre-existing bug while testing T3: editing a customer stacked the detail modal under the edit modal. Fixed separately (d4a89c25) with a test.
