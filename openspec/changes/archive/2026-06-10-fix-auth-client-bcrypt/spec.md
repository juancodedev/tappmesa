# Spec: auth-service — Refactor to API Routes

## Context

Refactor puro de `authService` en `src/lib/supabase.js`. `secureAuthDirect.js` (SHA-256 con salt estático + fallback hash 32-bit + comparación en texto plano) se reemplaza con llamadas `fetch()` a las API routes serverless que usan bcrypt. La interfaz pública (`signIn`, `signUp`, `signOut`, `getCurrentSession`, `getTrialStatus`) NO cambia.

## ADDED Requirements

### Requirement: AUTH-API-01 — signIn via POST /api/auth/signin

`authService.signIn(email, password)` MUST llamar a `POST /api/auth/signin` con body `{ email, password }`. En éxito, MUST guardar `sessionToken` en `localStorage['tappmesa-session']` y retornar `{ success, admin, tenant, sessionToken }`.

#### Scenario: Login exitoso

- GIVEN email y password válidos de un admin activo
- WHEN `authService.signIn(email, password)` se ejecuta
- THEN fetch POST `/api/auth/signin` con `{ email, password }`
- AND recibe 200 con `{ success: true, admin, tenant, sessionToken }`
- AND persiste `sessionToken` en `localStorage['tappmesa-session']`
- AND retorna `{ success: true, admin, tenant, sessionToken }`

#### Scenario: Credenciales inválidas

- GIVEN email inexistente o password incorrecto
- WHEN `authService.signIn(email, password)` se ejecuta
- THEN recibe 401 con `{ error }`
- AND retorna `{ success: false, error }` sin modificar localStorage

#### Scenario: Error de red / cold start

- GIVEN la API route no responde (timeout, network failure)
- WHEN `authService.signIn(email, password)` se ejecuta
- THEN atrapa el error del fetch
- AND retorna `{ success: false, error: "Error de conexión. Intenta nuevamente." }`

### Requirement: AUTH-API-02 — signUp via POST /api/auth/signup

`authService.signUp(userData)` MUST llamar a `POST /api/auth/signup` con `{ email, password, ownerName, restaurantName, ... }`. En éxito, MUST guardar `sessionToken` en localStorage y retornar la respuesta completa con `trialInfo`.

#### Scenario: Registro exitoso

- GIVEN datos completos de registro
- WHEN `authService.signUp(userData)` se ejecuta
- THEN fetch POST `/api/auth/signup` con los datos
- AND recibe 201 con `{ success, tenant, admin, sessionToken, trialInfo }`
- AND persiste `sessionToken` en localStorage, retorna el objeto completo

#### Scenario: Email duplicado

- GIVEN un email ya registrado
- WHEN `authService.signUp(userData)` se ejecuta
- THEN recibe 400 con `{ error: "El email ya está registrado" }`
- AND retorna `{ success: false, error }`

### Requirement: AUTH-API-03 — getCurrentSession via GET /api/auth/session

`authService.getCurrentSession()` MUST leer `localStorage['tappmesa-session']`. Si existe token, llama a `GET /api/auth/session` con header `Authorization: Bearer {token}`.

#### Scenario: Sesión válida

- GIVEN token válido en localStorage
- WHEN `getCurrentSession()` se ejecuta
- THEN fetch GET `/api/auth/session` con Bearer token
- AND recibe 200 con `{ admin, tenant, sessionToken }`
- AND retorna el objeto

#### Scenario: Token expirado o inválido

- GIVEN token expirado en localStorage
- WHEN `getCurrentSession()` se ejecuta
- THEN recibe 401
- AND elimina token de localStorage, retorna `null`

#### Scenario: Sin token

- GIVEN no hay token en localStorage
- WHEN `getCurrentSession()` se ejecuta
- THEN retorna `null` sin hacer fetch

### Requirement: AUTH-API-04 — signOut via POST /api/auth/signout

`authService.signOut()` MUST llamar a `POST /api/auth/signout` con `Authorization: Bearer {token}`. Siempre MUST limpiar localStorage, independiente del resultado.

#### Scenario: Logout exitoso

- GIVEN token en localStorage
- WHEN `signOut()` se ejecuta
- THEN fetch POST `/api/auth/signout` con Bearer token
- AND elimina token de localStorage

#### Scenario: Logout sin token o con error de red

- GIVEN cualquier estado (token o no, red disponible o no)
- WHEN `signOut()` se ejecuta
- THEN intenta el fetch (falla silenciosamente si hay error)
- AND siempre elimina `localStorage['tappmesa-session']`
- AND retorna `{ success: true }`

### Requirement: AUTH-API-05 — getTrialStatus preservado

`authService.getTrialStatus(tenantId)` MUST permanecer exactamente como está, usando `supabase.from('tenants').select(...)` directo (no pasa por API routes).

#### Scenario: Sin cambios

- GIVEN tenant ID
- WHEN `getTrialStatus(tenantId)` se ejecuta
- THEN consulta Supabase directamente
- AND retorna `{ endDate, daysLeft, isExpired, isExpiring }` o `null`

### Requirement: AUTH-API-06 — Métodos deprecated preservados

`authService.hashPassword()` y `authService.generateSessionToken()` MUST permanecer como stubs con warnings de deprecación.

## REMOVED Requirements

### Requirement: AUTH-SECURE-DIRECT — Eliminar secureAuthDirect.js

El archivo `src/lib/secureAuthDirect.js` y su import en `src/lib/supabase.js` MUST ser eliminados.

## API Contract

| Método | HTTP | Endpoint | Auth | Request | Response éxito |
|--------|------|----------|------|---------|----------------|
| signIn | POST | `/api/auth/signin` | — | `{ email, password }` | 200 `{ success, admin, tenant, sessionToken }` |
| signUp | POST | `/api/auth/signup` | — | `{ email, password, ownerName, restaurantName, ... }` | 201 `{ success, tenant, admin, sessionToken, trialInfo }` |
| getCurrentSession | GET | `/api/auth/session` | Bearer | — | 200 `{ admin, tenant, sessionToken }` |
| signOut | POST | `/api/auth/signout` | Bearer | — | 200 `{ success }` |

## Error Mapping

| HTTP | API body | authService retorna |
|------|----------|-------------------|
| 400 | `{ error }` | `{ success: false, error }` |
| 401 | `{ error }` | `{ success: false, error }` |
| 405 | `{ error }` | `{ success: false, error }` |
| 500 | `{ error }` | `{ success: false, error }` |
| Network error | — | `{ success: false, error: "Error de conexión. Intenta nuevamente." }` |

## Edge Cases

| Caso | Comportamiento |
|------|---------------|
| API route en cold start (Vercel) | Fetch puede tardar varios segundos. authService MUST usar timeout implícito (fetch por defecto) y capturar error. |
| Token malformado en localStorage | Se envía como Bearer. API responde 401 → authService limpia localStorage y retorna null/error. |
| Doble signOut | Segundo llamado: no hay token en localStorage → fetch sin header, siempre limpia y retorna `{ success: true }`. |
| Registro con datos inválidos | API valida y responde 400 con mensaje específico. authService propaga el error sin modificar localStorage. |
| Supabase client null | `getTrialStatus()` y `supabase` nullable existen antes del cambio. Si supabase es null, getTrialStatus falla silenciosamente (comportamiento preexistente, no se modifica). |
| Fetch lanza excepción | Catch genérico → retorna error amigable. No hay logging interno (el error handling vive en AuthContext). |
