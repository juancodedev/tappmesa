# Proposal: fix-auth-client-bcrypt

## Intent

Eliminar un backdoor crítico de seguridad: `src/lib/secureAuthDirect.js` bypassea bcrypt usando SHA-256 con salt estático, un fallback hash de 32 bits colisionable, y comparación en texto plano. `src/lib/supabase.js` delega todo `authService` a ese archivo, anulando el sistema bcrypt implementado en las API routes serverless.

## Scope

### In Scope
- Eliminar `src/lib/secureAuthDirect.js` (406 líneas, código inseguro)
- Refactorizar `authService` en `src/lib/supabase.js` para llamar a API routes via fetch
- Preservar `getTrialStatus()` (usa Supabase client directo, no auth)
- Todos los tests existentes de auth deben seguir pasando

### Out of Scope
- Migrar hashes existentes en DB (se maneja vía password reset)
- Refactor de otros servicios (`orderService`, `menuService`, etc.)
- Cambios en la API de AuthContext (interfaz pública no cambia)
- Migrar a Supabase Auth nativo

## Capabilities

### New Capabilities
None — pure refactor. Auth interface (signIn, signUp, signOut, getCurrentSession) no cambia.

### Modified Capabilities
None — no cambian requerimientos a nivel spec.

## Approach

1. **Eliminar** `src/lib/secureAuthDirect.js` por completo
2. **Refactorizar** `authService` en `supabase.js`:
   - Cada método (`signIn`, `signUp`, `signOut`, `getCurrentSession`) hace `fetch()` a `/api/auth/{endpoint}`
   - `signIn` → POST `/api/auth/signin` con `{ email, password }`
   - `signUp` → POST `/api/auth/signup` con `{ email, password, ownerName, restaurantName, ... }`
   - `getCurrentSession` → GET `/api/auth/session` con `Authorization: Bearer {token}`
   - `signOut` → POST `/api/auth/signout` con token en header
   - `getTrialStatus` se mantiene igual (usa supabase client directo)
3. **Gestionar session token** en localStorage con el mismo key `tappmesa-session`
4. **Error handling**: wrappear respuestas de API al formato que AuthContext espera (`{ success, admin, tenant, sessionToken, error }`)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/secureAuthDirect.js` | Removed | Archivo completo eliminado |
| `src/lib/supabase.js` | Modified | authService.replace() con fetch-based impl |
| `api/auth/signin.js` | Unchanged | Referencia — test de integración |
| `api/auth/signup.js` | Unchanged | Referencia — test de integración |
| `api/auth/session.js` | Unchanged | Referencia — test de integración |
| `api/auth/signout.js` | Unchanged | Referencia — test de integración |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API routes no disponibles (Vercel cold start) | Med | Timeout corto + error claro al usuario |
| Formato respuesta API distinto al esperado | Low | Tests de integración contra API real |
| getTrialStatus usa supabase nullable (line 7-14) | Low | Se mantiene igual, no tocar |

## Rollback Plan

Restaurar `src/lib/secureAuthDirect.js` desde git (`git restore src/lib/secureAuthDirect.js`) y revertir cambios en `src/lib/supabase.js`. El auth vuelve a funcionar con el servicio directo.

## Dependencies

- Ninguna. `bcryptjs` ya está en `package.json` (server-side).
- API routes deben estar deployadas en Vercel y accesibles desde el frontend.

## Success Criteria

- [ ] `secureAuthDirect.js` ya no existe en el código
- [ ] `authService.signIn()` llama a POST `/api/auth/signin` y retorna session token
- [ ] `authService.signUp()` llama a POST `/api/auth/signup` y crea tenant+admin
- [ ] `authService.getCurrentSession()` usa GET `/api/auth/session` con token Bearer
- [ ] `authService.signOut()` llama a POST `/api/auth/signout`
- [ ] `getTrialStatus()` sigue funcionando sin cambios
- [ ] AuthContext.login/register/logout funcionan sin errores
- [ ] Todos los tests existentes pasan
