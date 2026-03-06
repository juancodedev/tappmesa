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
- **Vercel** - Serverless deployment

### Autenticación
- bcrypt para hashing de passwords
- Session tokens con expiración
- Row Level Security (RLS)

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- npm o pnpm
- Cuenta en Supabase

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/tappmesa.git
cd tappmesa
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=tu-supabase-url
VITE_SUPABASE_ANON_KEY=tu-supabase-anon-key
VITE_API_BASE_URL=http://localhost:5173
```

4. **Ejecutar migraciones de base de datos**

Ver `database/00-ORDEN-DE-EJECUCION.md` para el orden correcto.

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

Acceder a: `http://localhost:5173`

## 🚀 Desarrollo Local

### URLs de Desarrollo

#### Landing Page
```
http://localhost:5173
http://tappmesa.localhost:5173
```

#### Tenant (Cafetería)
```
http://teteria-luna-tappmesa.localhost:5173
http://coffee-central-tappmesa.localhost:5173
```

#### Admin de Tenant
```
http://teteria-luna-tappmesa.localhost:5173/admin
```

#### Super Admin (Global)
```
http://localhost:5173/admin
```

### Subdominios Locales

Los navegadores modernos resuelven automáticamente `*.localhost` a `127.0.0.1`.

Ver `DESARROLLO-LOCAL-SUBDOMINIOS.md` para configuración detallada.

## 🔐 Credenciales de Prueba

> ⚠️ **SOLO PARA DESARROLLO** - Cambiar en producción

### Super Admin (Acceso Global)
```
Email: superadmin@tappmesa.dev
Password: TappM3sa$2025!Super
Acceso: http://localhost:5173/admin
```

### Tenant Admin - Tetería Luna
```
Email: admin@teteria-luna.dev
Password: T3t3r1aLun4#2025
Acceso: http://teteria-luna-tappmesa.localhost:5173/admin
```

### Tenant Admin - Coffee Central
```
Email: admin@coffee-central.dev
Password: C0ff33C3ntr@l!25
Acceso: http://coffee-central-tappmesa.localhost:5173/admin
```

### Staff - Mesero
```
Email: mesero@teteria-luna.dev
Password: M3s3r0T3t3r14!
Rol: waiter
```

### Staff - Cocina
```
Email: cocina@teteria-luna.dev
Password: C0c1n4T3t3r14!
Rol: kitchen
```

## 📁 Estructura del Proyecto

```
tappmesa/
├── api/                      # Serverless functions (Vercel)
│   └── auth/                # Endpoints de autenticación
├── database/                # Migraciones SQL
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
│   ├── lib/               # Utilidades y servicios
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
- Session tokens con expiración
- Invalidación automática en logout
- Reset de password seguro

### Base de Datos
- Row Level Security (RLS) habilitado
- Políticas por tenant y rol
- Foreign keys para integridad
- Auditoría de cambios

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

Configurar en dashboard de Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

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
