# Design: fix-auth-client-bcrypt

## Technical Approach

Refactor puro del `authService` en `src/lib/supabase.js`: eliminar el import y delegación a `secureAuthDirect.js` (406 líneas con SHA-256 de salt estático, fallback hash 32-bit colisionable, y comparación en texto plano), y reemplazar cada método con `fetch()` directo a las API routes serverless que ya usan bcrypt. `getTrialStatus()` se preserva sin cambios.

La interfaz pública (`signIn`, `signUp`, `signOut`, `getCurrentSession`, `getTrialStatus`) NO cambia — AuthContext y todos los consumidores existentes siguen funcionando sin modificaciones.

## Architecture Decisions

### Decision: API Base URL determinística

**Choice**: Usar `import.meta.env.VITE_API_BASE_URL || ''` (relativo al mismo host) para construir las URLs de fetch.
**Alternatives considered**: Usar una URL hardcodeada como en `src/lib/authService.js`.
**Rationale**: `src/services/api.js` ya define este patrón: `API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''`. Con string vacío, `/api/auth/signin` resuelve contra el mismo origen, que funciona en localhost:5173 (Vite dev server) y en Vercel. Si se necesita override (ej: deploy preview), `VITE_API_BASE_URL` lo cubre. Este es el patrón existente del proyecto.

### Decision: Manejo de errores con response.ok, no try/catch de fetch

**Choice**: Verificar `response.ok` después de cada fetch para decidir éxito vs error, y parsear el body para extraer mensajes de error.
**Alternatives considered**: Atrapar errores de fetch y asumir network failure — se hace en paralelo como fallback.
**Rationale**: La API routes devuelven errores con status code (400, 401, 405, 500) y body JSON `{ error: string }`. `response.ok` es false para todos esos casos. Si el fetch mismo falla (network error, cold start timeout), se captura con try/catch. Esto da dos capas: error HTTP controlado vs error de red.

### Decision: Eliminar `secureAuthDirect.js` por completo, sin stub

**Choice**: Borrar el archivo y su import. No dejar stubs ni re-exportaciones.
**Alternatives considered**: Dejar el archivo con un comment de deprecación. No — si queda, alguien puede re-importarlo.
**Rationale**: Spec AUTH-SECURE-DIRECT es explícito: eliminar archivo e import. Git history permite recuperarlo si es necesario. No hay dependencias externas a `src/lib/supabase.js`.

### Decision: Refactor in-situ en `src/lib/supabase.js`

**Choice**: Reescribir el objeto `authService` en el mismo archivo, no crear un archivo separado.
**Alternatives considered**: Crear `src/lib/authService.js` y consumirlo desde `supabase.js`. No — la spec dice "refactorizar authService en src/lib/supabase.js".
**Rationale**: El cambio es quirúrgico. `authService` ya es un objeto dentro de `supabase.js` con métodos delegados a `directAuthService`. Se reemplaza cada método por su implementación fetch-based. El resto del archivo (orderService, menuService, etc.) no se toca.

## Data Flow

### signIn(email, password)

```
AuthContext.login(email, password)
  └─→ authService.signIn(email, password)
        └─→ fetch POST /api/auth/signin { email, password }
              │
              ├── 200 → { success: true, admin, tenant, sessionToken }
              │         └─→ localStorage.setItem('tappmesa-session', sessionToken)
              │         └─→ return { success: true, admin, tenant, sessionToken }
              │
              ├── 4xx/5xx → { error: string }
              │              └─→ return { success: false, error }
              │
              └── Network Error (catch)
                           └─→ return { success: false, error: "Error de conexión. Intenta nuevamente." }
```

### signUp(userData)

```
AuthContext.register(registrationData)
  └─→ authService.signUp(userData)
        └─→ fetch POST /api/auth/signup { email, password, ownerName, restaurantName, ... }
              │
              ├── 201 → { success: true, tenant, admin, sessionToken, trialInfo }
              │         └─→ localStorage.setItem('tappmesa-session', sessionToken)
              │         └─→ return { success: true, tenant, admin, sessionToken, trialInfo }
              │
              ├── 4xx/5xx → { error: string }
              │              └─→ return { success: false, error }
              │
              └── Network Error → return { success: false, error: "Error de conexión. Intenta nuevamente." }
```

### getCurrentSession()

```
AuthContext.checkAuthStatus()
  └─→ authService.getCurrentSession()
        │
        ├── No token in localStorage
        │     └─→ return null
        │
        └── Token exists
              └─→ fetch GET /api/auth/session
                    Headers: { Authorization: Bearer {token} }
                    │
                    ├── 200 → { admin, tenant, sessionToken }
                    │         └─→ return { admin, tenant, sessionToken }
                    │
                    ├── 401 → (invalid/expired)
                    │         └─→ localStorage.removeItem('tappmesa-session')
                    │         └─→ return null
                    │
                    └── Network Error
                          └─→ localStorage.removeItem('tappmesa-session')
                          └─→ return null
```

### signOut()

```
AuthContext.logout()
  └─→ authService.signOut()
        │
        ├── Token in localStorage
        │     └─→ fetch POST /api/auth/signout
        │           Headers: { Authorization: Bearer {token} }
        │           (si falla, ignora silenciosamente)
        │
        └── Siempre:
              └─→ localStorage.removeItem('tappmesa-session')
              └─→ return { success: true }
```

### getTrialStatus(tenantId) — SIN CAMBIOS

```
AuthContext.checkTrialStatus(tenantId)
  └─→ authService.getTrialStatus(tenantId)
        └─→ supabase.from('tenants').select(...).eq('id', tenantId).single()
        └─→ return { endDate, daysLeft, isExpired, isExpiring } | null
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/secureAuthDirect.js` | Delete | Archivo completo eliminado (406 líneas de código inseguro) |
| `src/lib/supabase.js` | Modify | authService reescrito con fetch-based impl; import de secureAuthDirect eliminado; getTrialStatus preservado |
| `api/auth/signin.js` | Unchanged | Referencia de formato request/response |
| `api/auth/session.js` | Unchanged | Referencia de formato request/response |
| `api/auth/signup.js` | Unchanged | Referencia de formato request/response |
| `api/auth/signout.js` | Unchanged | Referencia de formato request/response |

## Interfaces / Contracts

### authService (sin cambios en interfaz pública)

```js
export const authService = {
  async signUp(userData)          → { success, admin?, tenant?, sessionToken?, trialInfo?, error? }
  async signIn(email, password)    → { success, admin?, tenant?, sessionToken?, error? }
  async signOut()                  → { success }
  async getCurrentSession()        → { admin, tenant, sessionToken } | null
  async getTrialStatus(tenantId)   → { endDate, daysLeft, isExpired, isExpiring } | null
  // Deprecados
  async hashPassword(password)     → password (stub con warning)
  generateSessionToken()           → null (stub con warning)
}
```

### API Routes Contract (preexistente, no cambia)

| Método | HTTP | Endpoint | Auth | Request | Response éxito |
|--------|------|----------|------|---------|----------------|
| signIn | POST | `/api/auth/signin` | — | `{ email, password }` | 200 `{ success, admin, tenant, sessionToken }` |
| signUp | POST | `/api/auth/signup` | — | `{ email, password, ownerName, restaurantName, ... }` | 201 `{ success, tenant, admin, sessionToken, trialInfo }` |
| getCurrentSession | GET | `/api/auth/session` | Bearer | — | 200 `{ admin, tenant, sessionToken }` |
| signOut | POST | `/api/auth/signout` | Bearer | — | 200 `{ success }` |

### Error Mapping

| HTTP | API body | authService retorna |
|------|----------|-------------------|
| 400 | `{ error }` | `{ success: false, error }` |
| 401 | `{ error }` | `{ success: false, error }` |
| 405 | `{ error }` | `{ success: false, error }` |
| 500 | `{ error }` | `{ success: false, error }` |
| Network error | — | `{ success: false, error: "Error de conexión. Intenta nuevamente." }` |

## Component Design: Implementación concreta

El código reemplaza cada método delegado en `src/lib/supabase.js` líneas 20-50. La implementación sigue exactamente el patrón de `src/services/api.js` para la URL base y usa `response.ok` para diferenciar HTTP errors de network errors.

```js
// src/lib/supabase.js — authService refactorizado

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const authService = {
  async signUp(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Error al crear la cuenta' };
      }
      if (data.sessionToken) {
        localStorage.setItem('tappmesa-session', data.sessionToken);
      }
      return data;
    } catch {
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  },

  async signIn(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión' };
      }
      if (data.sessionToken) {
        localStorage.setItem('tappmesa-session', data.sessionToken);
      }
      return data;
    } catch {
      return { success: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  },

  async signOut() {
    const sessionToken = localStorage.getItem('tappmesa-session');
    if (sessionToken) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch {
        // Ignorar error de red — siempre limpiar localStorage
      }
    }
    localStorage.removeItem('tappmesa-session');
    return { success: true };
  },

  async getCurrentSession() {
    const sessionToken = localStorage.getItem('tappmesa-session');
    if (!sessionToken) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        localStorage.removeItem('tappmesa-session');
        return null;
      }
      return await response.json();
    } catch {
      localStorage.removeItem('tappmesa-session');
      return null;
    }
  },

  // Deprecated stubs — sin cambios
  async hashPassword(password) {
    console.warn('⚠️  Client-side password hashing is deprecated...');
    return password;
  },

  generateSessionToken() {
    console.warn('⚠️  Client-side session token generation is deprecated...');
    return null;
  },

  // SIN CAMBIOS — getTrialStatus sigue igual
  async getTrialStatus(tenantId) { /* ... existing impl ... */ }
};
```

## Error Boundaries

| Capa | Error | Comportamiento |
|------|-------|---------------|
| **fetch()** | Network error / timeout | Catch → retorna `{ success: false, error: "Error de conexión..." }` |
| **API route** | 400 Bad Request | `!response.ok` → parsea `data.error` → retorna `{ success: false, error }` |
| **API route** | 401 Unauthorized | `!response.ok` → en signIn/signUp propaga error; en getCurrentSession limpia token y retorna null |
| **API route** | 405 Method Not Allowed | `!response.ok` → parsea `data.error` → retorna `{ success: false, error }` |
| **API route** | 500 Server Error | `!response.ok` → parsea `data.error` → retorna `{ success: false, error }` |
| **signOut** | Cualquier error de red | Catch silencioso — no interrumpe el cleanup de localStorage |
| **AuthContext** | Cualquier error de authService | El catch en AuthContext.login/register/logout se mantiene exactamente igual — captura y muestra error genérico |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `authService.signIn()` con fetch mockeado | Mockear `global.fetch` con `vi.fn()`. Verificar que POST `/api/auth/signin` recibe `{ email, password }`. Verificar que 200 guarda token en localStorage y retorna el objeto correcto. |
| Unit | `authService.signIn()` con error | Mockear fetch para devolver 401. Verificar que retorna `{ success: false, error }` y NO modifica localStorage. |
| Unit | `authService.signIn()` con network error | Mockear fetch para que lance excepción. Verificar que retorna `{ success: false, error: "Error de conexión..." }`. |
| Unit | `authService.signUp()` con fetch mockeado | Mockear fetch. Verificar POST `/api/auth/signup` con userData. 201 guarda token y retorna objeto completo. |
| Unit | `authService.signUp()` con email duplicado | Mockear fetch 400 `{ error: "El email ya está registrado" }`. Verificar que retorna error sin tocar localStorage. |
| Unit | `authService.getCurrentSession()` sin token | Verificar que retorna null sin hacer fetch (localStorage.getItem mockeado vacío). |
| Unit | `authService.getCurrentSession()` con token válido | Mockear fetch 200. Verificar GET con Bearer header. Retorna `{ admin, tenant, sessionToken }`. |
| Unit | `authService.getCurrentSession()` con token expirado | Mockear fetch 401. Verificar que limpia localStorage y retorna null. |
| Unit | `authService.signOut()` con token | Mockear fetch POST `/api/auth/signout`. Verificar que siempre limpia localStorage. |
| Unit | `authService.signOut()` sin token | Verificar que no hace fetch pero igual limpia localStorage y retorna `{ success: true }`. |
| Unit | `authService.getTrialStatus()` | Verificar que sigue usando supabase directo (sin fetch). No se mockea fetch. |
| Integration | AuthContext + authService | Tests existentes de AuthContext deben seguir pasando sin cambios. |
| Integration | Flujo completo login | End-to-end mockeando fetch: login → getCurrentSession → logout. Verificar que los tokens se persisten/limpian correctamente. |

### Mock strategy

Usar `vi.stubGlobal('fetch', vi.fn())` en setup de test, o mockear por test. El mock de fetch debe:

```js
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Success response factory
function mockFetchSuccess(body) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body)
  })
}

// Error response factory
function mockFetchError(status, errorMsg) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: errorMsg })
  })
}

// Network error factory
function mockFetchNetworkError() {
  mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
}
```

El test de `getTrialStatus()` **no** mockea fetch, sino que usa `createMockSupabase()` (ya existente en `src/test/utils.js`) para mockear `supabase.from(...)`.

## Migration / Rollout

No migration required. El cambio es atómico:

1. Eliminar `src/lib/secureAuthDirect.js`
2. Modificar `src/lib/supabase.js` (eliminar import, reemplazar métodos)
3. Todos los tests deben pasar

Rollback: `git restore src/lib/secureAuthDirect.js src/lib/supabase.js`

## Open Questions

- None. El diseño está completamente especificado y todas las decisiones están resueltas por la spec.
