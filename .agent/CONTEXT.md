# Instrucciones globales

## Idioma
Responde siempre en español.

## Sobre el proyecto

**TappMesa** es una plataforma SaaS multi-tenant para gestión de cafeterías y restaurantes chilenos. Ofrece menús digitales con QR, gestión de pedidos, dashboard administrativo y panel de superadmin. Desplegado en Vercel con Supabase como base de datos.

URL de producción: `https://tappmesa.juancode.dev/` (también puede ser `tappmesa.vercel.app`)

## Stack tecnológico

### Frontend
- **React 19** + **React Router 7**
- **Vite 7** como build tool
- **Tailwind CSS 4** (usando el plugin de Vite, no PostCSS)
- **Lucide React** para íconos
- **Radix UI / @radix-ui/themes** para componentes primitivos

### Backend & Base de datos
- **Supabase** (PostgreSQL + Auth + Storage) con **Row Level Security (RLS)**
- **Prisma ORM** para schema y migraciones (schema en `prisma/schema.prisma`)
- **Vercel Serverless Functions** en `api/auth/` (signup, signin, signout, session, reset-password)

### Autenticación
- bcrypt (12 salt rounds) — siempre server-side, NUNCA en el cliente
- Session tokens almacenados en localStorage como `tappmesa-session`
- Tablas `admin_users` y `admin_sessions`

### Testing
- **Vitest** + **React Testing Library** + **jsdom**

### Monitoring
- **Sentry** (`@sentry/react`)
- **Vercel Analytics**

## Comandos de desarrollo

```bash
npm run dev          # Dev server en puerto 5173
npm run build        # Build de producción
npm run lint         # ESLint
npm test             # Tests en modo watch
npm run test:run     # Tests una sola vez
npm run test:coverage
```

## Arquitectura multi-tenant

La app opera en 4 modos según la URL:

| Modo | URL ejemplo |
|------|------------|
| **Landing** | `localhost:5173` |
| **Tenant** (menú cliente) | `cafe-tappmesa.localhost:5173` |
| **Table** (sesión de mesa QR) | `cafe-tappmesa.localhost:5173/ABCD1234/menu` |
| **Admin** (dashboard) | `cafe-tappmesa.localhost:5173/admin` o `localhost:5173/admin` (superadmin) |

La lógica de detección vive en `src/context/TenantContext.jsx` → funciones `getSubdomain()`, `getTableCode()`, `getAppType()`.

Formato Vercel: `[tenant-name]-tappmesa.vercel.app`

## Contextos React (global state)

- `TenantContext` (`src/context/TenantContext.jsx`) — datos del tenant, sesión de mesa, branding dinámico
- `AuthContext` (`src/context/AuthContext.jsx`) — autenticación y session token
- `CartContext` (`src/context/CartContext.jsx`) — carrito con persistencia en localStorage
- `ReservationsContext` — gestión de reservas

**Regla:** Nunca usar TenantContext directamente. Usar siempre el hook `useTenant()`.

## Estructura de carpetas clave

```
src/
├── components/          # Componentes UI compartidos (admin/, Auth/, Landing/, layout/, common/)
├── context/             # Providers de React Context
├── features/            # Módulos por feature (cart/, menu/, orders/, reservations/)
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       └── services/
├── hooks/               # Custom hooks
├── lib/                 # supabase.js, authService, secureAuthDirect.js
├── pages/               # auth/, dashboard/, landing/
├── services/            # Capas de servicio API
├── test/                # Setup de tests y utilidades
└── utils/               # Helpers

api/auth/                # Serverless functions de autenticación
database/                # Migraciones SQL (ver 00-ORDEN-DE-EJECUCION.md)
prisma/                  # Schema de Prisma
```

## Modelos de base de datos principales

- `tenants` — raíz del aislamiento multi-tenant (subdomain, slug, colors)
- `admin_users` — usuarios con roles: `super_admin`, `tenant_admin`, `staff` (`waiter`, `kitchen`)
- `admin_sessions` — tokens de sesión con expiración
- `products`, `categories` — carta del menú
- `orders`, `order_items` — pedidos
- `tables`, `table_sessions` — mesas con código QR (8-12 chars alfanumérico mayúscula)
- `customers`, `customer_order_history` — fidelización
- `stock_inventory`, `stock_movements` — inventario

## Servicios (`src/lib/supabase.js`)

- `supabase` — cliente Supabase
- `authService` → usa `directAuthService` de `secureAuthDirect.js`
- `orderService`, `menuService`, `configService`, `analyticsService`, `customerService`, `utils`

Para llamadas autenticadas usar:
```javascript
await secureAuthService.authenticatedFetch('/api/endpoint', { method: 'GET' })
```

## Variables de entorno requeridas

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=          # URL de Vercel en producción
```

## Estilo de código

- Componentes funcionales con hooks
- Imports del hook `useTenant()` en vez de contexto directo
- Rutas admin protegidas con `<ProtectedRoute>` (ver `src/components/ProtectedRoute.jsx`)
- Cálculo de IVA: siempre 19% → `total = subtotal * 1.19`
- Códigos de mesa: siempre mayúsculas, validar con `/^[A-Z0-9]{8,12}$/`
- Nunca hashear password en el cliente

## Preferencias generales

- Usar `pnpm` como gestor de paquetes
- Mantener separación feature-based en `src/features/`
- Tests en `src/test/` siguiendo patrones de `src/test/utils.js`
- Documentar cambios importantes en `CHANGELOG.md`
- Ante dudas de seguridad, consultar `SECURE_AUTH_GUIDE.md`
- Para multi-tenant, consultar `MULTI-TENANT-ISOLATION-GUIDE.md`

# Reglas

- Siempre responder en español
- Nunca hashear contraseñas en el cliente (siempre en `api/auth/`)
- No usar TenantContext directamente; usar el hook `useTenant()`
- Los códigos QR de mesa son alfanuméricos en mayúscula (8-12 chars)
- RLS en Supabase filtra automáticamente por `tenant_id`; no omitir
- Los session tokens se guardan en localStorage como `tappmesa-session`
