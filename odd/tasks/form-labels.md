# Form label association

Objective: every form `<label>` names its control, so screen readers announce the field and clicking the label focuses it.
Branch per slice off `main` · Delivery: one PR per task, independent (disjoint files) · Test runner: Vitest (`npm run test:run`).

## Specs

- S1 (L1): "listo, mergeado, sigue con los labels" — UX audit item 2: 153 `<label>`, 17 `htmlFor`.
- S2: A label that names one control gets `htmlFor` and the control a matching `id`. Ids are static, prefixed by the screen (`product-name`, `settings-phone`), unique in the file. A label that already wraps its control stays as is.
- S3: A "label" over a group of controls (radio buttons, color swatches, toggle buttons) is not a label: it becomes a `<span>`/`<p>` with an id, and the group gets `role="group"` + `aria-labelledby`.
- S4: Behavior and styling unchanged: same classes, handlers, values; no visual change.
- S5: Each slice: a guard test using `src/test/design/labelAssociation.js` over its files (RED first) and at least one `getByLabelText` test through the rendered form; full suite, lint, build.

## Tasks

| ID | Screens | Labels | Specs | Route | Status | Commit |
|---|---|---|---|---|---|---|
| T1 | ReservationForm, RegisterPage | 21 | S2-S5 | delegated (parallel) | in progress | |
| T2 | Settings, PreBillSettings, UsersManager, TableStatusesManager, TablesManager | 31 | S2-S5 | delegated (parallel) | in progress | |
| T3 | ProductsManager, CategoriesManager, StockManager, CompleteStockManager | 35 | S2-S5 | delegated (parallel) | in progress | |
| T4 | ReservationsManager, CustomersManager, TenantSubscriptionsManager, SubscriptionPlansManager, SuperAdminTenantsManager | 27 | S2-S5 | delegated (parallel) | in progress | |

## Log

- L1 (2026-10-31): "listo, mergeado, sigue con los labels".
- L2: Inventory on main af864b39: 114 labels name no control (neither htmlFor nor a nested control) in 16 files. Route: four parallel writers (Writer trigger (a): independent units, disjoint files, ~30 labels each), parent owns git and opens one PR per slice from main.
