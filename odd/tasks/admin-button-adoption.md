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
| T2 | TablesManager, TableStatusesManager, QRGenerator | 30 | S2-S5 | inline | pending | |
| T3 | OrdersManager, ReservationsManager, CustomersManager | 26 | S2-S5 | inline | pending | |
| T4 | StockManager, CompleteStockManager | 21 | S2-S5 | inline | pending | |
| T5 | UsersManager, Analytics, Settings, Dashboard, PreBillSettings, SecureAdminApp | 23 | S2-S5 | inline | pending | |
| T6 | Waiter (dashboard, CreateOrderModal, TablesGrid, ActiveOrdersPanel), KitchenDashboard | 25 | S2-S5 | inline | pending | |
| T7 | Super admin managers | 29 | S2-S5 | inline | pending | |

## Log

- L1 (2026-10-29): "ramas mezcladas, sigamos con los botones del admin" — previously agreed: "me gusta tu vision, avancemos asi, por parte" (table flow first, then admin per screen).
- L2: Inventory: 171 `<button>` in 32 files. No writer delegation: slices are small and sequential.
- L3: T1 done (a17723d2): RED 4/4 (missing classes and names) → GREEN; suite 342/342, lint, build OK. Delete-product button had no accessible name at all.
