# ☕ Tappmesa - Sistema de Gestión para Cafeterías Premium

Sistema multi-tenant de gestión para cafeterías y pequeños restaurantes. Diseñado para ofrecer una experiencia digital fluida con una estética **Modern Cafe** acogedora y profesional.

## 📋 Tabla de Contenidos

- [Identidad Visual](#identidad-visual)
- [Características](#características)
- [Tech Stack](#tech-stack)
- [Instalación](#instalación)
- [Arquitectura](#arquitectura)

## 🎨 Identidad Visual (Modern Cafe)
El sistema utiliza una paleta de colores cuidadosamente seleccionada para evocar la calidez de una cafetería de especialidad:
- **Primary (Coffee)**: Tonos tierra profundos para una legibilidad premium.
- **Secondary (Sage)**: Verdes orgánicos para una sensación de calma y frescura.
- **Background (Cream)**: Fondos crema suaves que reducen la fatiga visual en dispositivos móviles.

## ✨ Características

### Para Clientes (Mesas)
- 📱 **Menú Digital Intuitivo**: Optimizado para lectura rápida y antojo visual.
- 🛒 **Gestión de Carrito Inteligente**: Personalización de pedidos (notas, temperatura).
- 📜 **Historial Local**: Seguimiento de pedidos realizados en la sesión actual.

### Para Administradores
- 📊 **Dashboard Holístico**: Métricas clave en tiempo real con diseño limpio.
- 🛠️ **Gestión de Menú**: Edición rápida de productos, categorías y disponibilidad.
- 🪑 **Control de Mesas**: Generación dinámica de QR y estados de mesa.

### Utilidades Core (Novedades)
- 🔔 **Sistema de Notificaciones**: Feedback instantáneo mediante Toasts.
- 💾 **Persistencia Inteligente**: Gestión de estado con LocalStorage robusto.
- 🔌 **API Hooking**: Capa de abstracción para comunicaciones Supabase simplificadas.

### Para Super Admin
- 🌍 Vista global de todos los tenants
- 🏢 Gestión de tenants y suscripciones
- 💰 Planes y límites personalizables
- 👥 Gestión de usuarios del sistema
- 📊 Reportes consolidados
- 🔧 Configuración global

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI Library
- **React Router 7** - Routing
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Storage
- **Prisma** - ORM y schema management
- **Vercel** - Serverless deployment (10 API routes)

### Autenticación
- bcrypt para hashing de passwords (12 rounds)
- JWT (HS256) para server-to-server auth
- Session tokens con expiración
- Claim-scoped Row Level Security (RLS)
- Capability tokens HMAC para mesas

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- pnpm
- Una base de datos PostgreSQL (recomendado: [Supabase](https://supabase.com) — plan gratis)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/juancodedev/tappmesa.git
cd tappmesa
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar variables de entorno**
```bash
cp .env.local.sample .env.local
```

Editar `.env.local` con tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=tu-jwt-secret-aqui
```

> ⚠️ **Importante**: `SUPABASE_JWT_SECRET` es solo server-side (nunca VITE_). Se usa para firmificar JWTs HS256. En Supabase local, está en `supabase/config.toml` bajo `[auth.jwt_secret]`.

4. **Sincronizar schema de base de datos** (opcional)
```bash
# Si tenés acceso directo a la DB:
npx prisma db push

# O ejecutar migraciones manuales desde database/
```

5. **Iniciar servidor de desarrollo**

Las API routes (serverless functions de Vercel) necesitan un servidor aparte:

```bash
# Terminal 1: API routes (puerto :3001)
node dev-server.js

# Terminal 2: Frontend (puerto :5173)
pnpm dev
```

O en una sola terminal:
```bash
pnpm dev:all
```

Acceder a: `http://localhost:5173`

> 💡 Para subdominios locales, los navegadores modernos resuelven `*.localhost` a `127.0.0.1` automáticamente. Ver [Desarrollo Local con Subdominios](DESARROLLO-LOCAL-SUBDOMINIOS.md).

### Solución de problemas de conexión

| Error | Causa probable | Solución |
|-------|---------------|----------|
| `supabase is null` en consola | `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no configurados | Verificar `.env.local` |
| `Error: Email o contraseña incorrectos` en login | DB sin datos de seed o auth routes sin service role key | Verificar `SUPABASE_SERVICE_ROLE_KEY` y correr seed |
| `Failed to fetch` en API routes | Vite dev server no redirige a API routes | Usar `pnpm dev` (Vite proxy configurado) |

## 🚀 Desarrollo Local

### URLs de Desarrollo

#### Landing Page
```
http://localhost:5173
```

#### Tenant (Cafetería) - Subdominios Locales
```
http://cafe-central-tappmesa.localhost:5173
http://teteria-luna-tappmesa.localhost:5173
http://bistro-sunrise-tappmesa.localhost:5173
http://coffee-co-tappmesa.localhost:5173
```

#### Admin de Tenant - Local

```
http://cafe-central-tappmesa.localhost:5173/admin
http://teteria-luna-tappmesa.localhost:5173/admin
```

#### Super Admin (Global) - Local

```
http://localhost:5173/admin
```

### Subdominios Locales

Los navegadores modernos resuelven automáticamente `*.localhost` a `127.0.0.1`.

Ver `DESARROLLO-LOCAL-SUBDOMINIOS.md` para configuración detallada.

**⚠️ Nota importante sobre el formato del subdominio:**

Es normal ver URLs con un patrón que parece duplicado (ej. `cafe-central-tappmesa.tappmesa.juancode.dev`). Esto obedece a una necesidad técnica:

- El sufijo `-tappmesa` es obligatorio para el aislamiento de bases de datos en Supabase
- Sin este sufijo, las políticas RLS no pueden diferenciar entre tenants en una base de datos compartida
- Todo el código base y migraciones asumen este patrón

En producción, la URL completa es `https://<tenant-identifier>-tappmesa.tappmesa.juancode.dev/`, pero para presentaciones o documentación al cliente, se puede mostrar el nombre simplificado `cafe-central.tappmesa.juancode.dev` manteniendo el `-tappmesa` en la configuración interna.

## 🔐 Credenciales de Prueba

> ⚠️ **SOLO PARA DESARROLLO** - Cambiar en producción

### Seed de datos

Para crear los usuarios de prueba en la base de datos:

```bash
# Asegurate de tener VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
pnpm seed
```

### Super Admin (Acceso Global)
```
Email: admin@tappmesa.com
Password: admin123
Acceso: http://localhost:5173/admin
```

### Tenant Admin - Café Central
```
Email: cafe-central@cafe-central.com
Password: admin123
Acceso: http://cafe-central-tappmesa.localhost:5173/admin
```

### Tenant Admin - Tetería Luna
```
Email: teteria-luna@teteria-luna.com
Password: admin123
Acceso: http://teteria-luna-tappmesa.localhost:5173/admin
```

### Tenant Admin - Bistro Sunrise
```
Email: bistro-sunrise@bistro-sunrise.com
Password: admin123
Acceso: http://bistro-sunrise-tappmesa.localhost:5173/admin
```

### Tenant Admin - Coffee & Co
```
Email: coffee-co@coffee-co.com
Password: admin123
Acceso: http://coffee-co-tappmesa.localhost:5173/admin
```

### Personal de Cocina - Dashboard
```
Email: cocina@tappmesa.local
Password: cocina123
Acceso: http://localhost:5173/kitchen
```

## 📁 Estructura del Proyecto

```
tappmesa/
├── api/                      # Serverless functions (Vercel) — route handlers only
│   ├── admin/               # Admin CRUD (users)
│   ├── auth/                # Auth endpoints (signin, signup, token, session, reset-password)
│   ├── orders.js            # Orders: place/my/cancel
│   └── table-sessions.js    # Table sessions: create/resume
├── lib/                     # Shared utilities (NOT deployed as functions)
│   ├── middleware/          # cors, rateLimit, requireAuth, validation
│   ├── services/           # emailService
│   └── utils/              # capability, hostResolver, jwt, logger
├── database/                # Migraciones SQL + archive
├── prisma/                  # Schema de Prisma
├── public/                  # Assets estáticos
├── src/
│   ├── components/         # Componentes React
│   │   ├── admin/         # Componentes de administración
│   │   ├── Landing/       # Landing page
│   │   ├── layout/        # Layouts
│   │   └── ui/            # Componentes UI reutilizables
│   ├── context/           # React Context providers
│   ├── features/          # Módulos por feature
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Client-side utils (supabase client)
│   ├── pages/             # Páginas principales
│   ├── services/          # Servicios API
│   └── test/              # Tests y utilidades de testing
├── .env                    # Variables de entorno (NO commitear)
└── vite.config.js         # Configuración de Vite
```

## 🏗️ Arquitectura Multi-Tenant

### Modos de Aplicación

1. **Landing** - Página principal de marketing
2. **Tenant** - Menú digital para clientes
3. **Table** - Sesión de mesa con QR
4. **Admin** - Panel administrativo (tenant o global)

### Detección de Tenant

- Por subdomain: `cafe-name-tappmesa.localhost:5173`
- Por query param: `?cafe=cafe-name`
- Formato Vercel: `cafe-name-tappmesa.vercel.app`

### Aislamiento de Datos

- Row Level Security (RLS) en Supabase
- Filtrado por `tenant_id` en todas las queries
- Políticas RLS por rol (super_admin, tenant_admin, staff)

Ver `MULTI-TENANT-ISOLATION-GUIDE.md` para detalles.

## 🧪 Testing

### Ejecutar Tests

```bash
# Modo watch
npm test

# Run once
npm run test:run

# Con cobertura
npm run test:coverage

# UI de tests
npm run test:ui
```

### Coverage Target
- Utilidades: 100%
- Context providers: 90%+
- Lógica crítica: 100%

Ver `TESTING.md` para guías detalladas.

## 🔒 Seguridad

### Autenticación
- Passwords hasheados con bcrypt (12 rounds)
- JWT (HS256) con `requireAuth` middleware para server routes
- Session tokens con expiración
- Invalidación automática en logout
- Reset de password seguro (server-minted tokens)

### Server Routes (todo via API, nada directo a Supabase)
- `POST /api/orders` — place order (capability o takeout via Host header)
- `GET /api/orders/my` — claim-scoped order history
- `POST /api/orders/:id/cancel` — cancel own orders
- `POST /api/table-sessions` — create/resume table session
- `POST /api/auth/token` — mint JWT for authenticated users
- `POST /api/admin/users` — CRUD usuarios (bcrypt, claim-scoped)

### Base de Datos
- Claim-scoped Row Level Security (`app_claim_tenant_id()`, `app_is_super_admin()`)
- Zero anon access on claim tables (orders, customers, table_sessions, etc.)
- Capability tokens HMAC para aislamiento de mesas
- Foreign keys para integridad
- Auditoría de cambios

### Infraestructura
- `lib/` separado de `api/` para estar bajo el límite de 12 functions (Vercel Hobby)
- CORS, rate limiting, y validación centralizados en `lib/middleware/`

Ver `SECURE_AUTH_GUIDE.md` para detalles de implementación.

## 📱 Deployment

### Vercel

```bash
# Build de producción
npm run build

# Preview build local
npm run preview

# Deploy (si tienes Vercel CLI)
vercel deploy
```

### Variables de Entorno en Vercel

Configurar en dashboard de Vercel (ver `.env.local.sample` para descripciones):

**Requeridas:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` — solo server-side, para JWT signing

**Recomendadas:**
- `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + `FROM_EMAIL` — emails transaccionales
- `KV_REST_API_URL` + `KV_REST_API_TOKEN` — rate limiting persistente (correr `vercel kv create`)

**Opcionales:**
- `FRONTEND_URL` — override para URLs en emails
- `MAX_CONCURRENT_SESSIONS` — límite de sesiones por usuario (default: 5)

### Subdominios en Vercel

Cada tenant necesita su subdominio configurado:
- `tenant-name-tappmesa.vercel.app`
- Vercel auto-genera certificados SSL

Ver `vercel.json` para configuración.

## 📚 Documentación Adicional

- [Desarrollo Local con Subdominios](DESARROLLO-LOCAL-SUBDOMINIOS.md)
- [Guía de Autenticación Segura](SECURE_AUTH_GUIDE.md)
- [Aislamiento Multi-Tenant](MULTI-TENANT-ISOLATION-GUIDE.md)
- [Testing](TESTING.md)
- [SuperAdmin Tenant Selector](SUPERADMIN_TENANT_SELECTOR.md)
- [Configuración Supabase](SUPABASE_SETUP.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 🆘 Soporte

Para soporte, crear un issue en GitHub o contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para la industria gastronómica chilena**
