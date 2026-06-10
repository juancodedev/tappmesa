# Tasks: fix-auth-client-bcrypt

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250 (additions) + ~410 (deletions) = ~660 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Tests + refactor + cleanup | Single PR | Atómico: tests primero, producción después, cleanup al final |

## Files Affected

| File | Action | Lines |
|------|--------|-------|
| `src/lib/supabase.js` | Modify | ~60 added, ~8 removed (350 unchanged) |
| `src/lib/secureAuthDirect.js` | Delete | −406 |
| `src/test/lib/authService.test.js` | Create | ~200 (new) |
| `src/test/context/AuthContext.test.jsx` | Unchanged | Solo verificar que pasa |

## Phase 1: Tests First (RED — TDD obligatorio)

- [x] **1.1 (T1)** — Crear `src/test/lib/authService.test.js` con layout de test: `vi.stubGlobal('fetch', vi.fn())`, helpers `mockFetchSuccess(body)`, `mockFetchError(status, msg)`, `mockFetchNetworkError()`, y cleanup en `afterEach`
- [x] **1.2 (T2)** — Tests para `signIn`: login exitoso (verifica POST body + localStorage + objeto retornado); credenciales inválidas (401 → `{ success: false, error }` sin localStorage); network error (→ "Error de conexión...")
- [x] **1.3 (T3)** — Tests para `signUp`: registro exitoso (201 → localStorage + `{ success, tenant, admin, sessionToken, trialInfo }`); email duplicado (400 → error sin localStorage)
- [x] **1.4 (T4)** — Tests para `getCurrentSession`: sin token (→ null, sin fetch); token válido (GET con Bearer → `{ admin, tenant, sessionToken }`); token expirado (401 → limpia localStorage + null)
- [x] **1.5 (T5)** — Tests para `signOut`: con token (POST + siempre limpia localStorage); sin token (no fetch + cleanup + `{ success: true }`); test para `getTrialStatus` (usa supabase directo, mockear `createMockSupabase()`)

## Phase 2: Refactor de Producción (GREEN)

- [x] **2.1 (T6)** — En `src/lib/supabase.js`: (a) eliminar `import { directAuthService } from './secureAuthDirect.js'` (línea 17); (b) agregar `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''`; (c) reescribir `signIn`, `signUp`, `signOut`, `getCurrentSession` con fetch según diseño (response.ok + try/catch); (d) preservar `getTrialStatus` y stubs deprecated sin cambios
- [x] **2.2 (T7)** — Eliminar archivo `src/lib/secureAuthDirect.js` completo (406 líneas) — ya no hay import que lo referencie

## Phase 3: Verification

- [x] **3.1 (T8)** — `npm run test:run`: todos los tests nuevos (authService) + tests existentes (AuthContext, CartContext, TenantContext) pasan sin errores ni warnings
- [x] **3.2 (T9)** — Smoke test manual: `npm run dev` sin errores de import; login/register/logout funcional desde la UI; getTrialStatus funciona sin cambios

## Dependency Order

```
T1 (test helpers) ─→ T2 (signIn tests) ─→ T6 (refactor supabase.js) ─→ T7 (delete secureAuthDirect) ─→ T8 (test suite) ─→ T9 (smoke test)
                  ─→ T3 (signUp tests) ─↑
                  ─→ T4 (session tests) ─↑
                  ─→ T5 (signOut tests) ─↑
```

T1→T5 son independientes entre sí (todos dentro del mismo archivo de test, se escriben secuencialmente). T6 y T7 requieren T1→T5 completos (TDD: tests primero). T8 es la validación final de que todo pasa.
