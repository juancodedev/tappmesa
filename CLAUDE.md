# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TappMesa is a multi-tenant restaurant/cafe management SaaS platform built with React + Vite. It provides digital menus, table QR codes, order management, and admin dashboards for Chilean cafes and restaurants. The system supports subdomain-based tenant isolation with both local development and production deployment on Vercel.

## Tech Stack

- **Frontend**: React 19, React Router 7, Vite 7
- **Styling**: Tailwind CSS 4 (with Vite plugin)
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Auth**: Custom bcrypt-based auth with session tokens (stored in admin_users/admin_sessions)
- **Deployment**: Vercel (with serverless API routes)
- **Testing**: Vitest + React Testing Library

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server on port 5173

# Building
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate coverage report

# Linting
npm run lint            # Run ESLint
```

### Running Specific Tests

```bash
# Run specific test file
npm run test:run src/test/utils/cartUtils.test.js

# Run tests in specific directory
npm run test:run src/test/context/

# Run tests with pattern
npm run test:run -- --grep "should calculate"
```

## Architecture

### Multi-Tenant Subdomain System

The app operates in 4 distinct modes based on URL structure:

1. **Landing** (`localhost:5173`, `tappmesa.vercel.app`) - Marketing landing page
2. **Tenant** (`cafe-name-tappmesa.localhost:5173`, `cafe-name-tappmesa.vercel.app`) - Customer-facing menu for specific tenant
3. **Table** (`cafe-name-tappmesa.localhost:5173/ABCD1234/menu`) - Table-specific session with QR code (8-12 char alphanumeric codes)
4. **Admin** (`cafe-name-tappmesa.localhost:5173/admin`) - Tenant admin dashboard (when subdomain present) OR global super admin (no subdomain)

**Key Logic**:
- `src/context/TenantContext.jsx`: Contains `getSubdomain()`, `getTableCode()`, and `getAppType()` functions
- Supports `.localhost`, `.local`, `.vercel.app`, and custom domains
- Vercel format: `[tenant-name]-tappmesa.vercel.app` (subdomain includes `-tappmesa` suffix)
- See `DESARROLLO-LOCAL-SUBDOMINIOS.md` for local development setup

### Context Architecture

The app uses React Context for global state:

- **TenantContext** (`src/context/TenantContext.jsx`): Loads tenant data based on subdomain, manages table sessions, applies dynamic branding (colors, title)
- **AuthContext** (`src/context/AuthContext.jsx`): Manages user authentication state and session tokens
- **CartContext** (`src/context/CartContext.jsx`): Shopping cart state with localStorage persistence
- **ReservationsContext** (`src/context/ReservationsContext.jsx`): Reservation management

**Important**: TenantContext automatically reloads when `authContext.user.tenant_id` changes (see lines 346-351).

### Database Schema (Prisma)

Located in `prisma/schema.prisma`. Key models:

- **tenants**: Multi-tenant isolation root (has subdomain, slug, colors, settings)
- **admin_users**: Authentication (email, password_hash with bcrypt, role, tenant_id)
- **admin_sessions**: Session management (session_token, expires_at, ip_address)
- **products**, **categories**: Menu items
- **orders**, **order_items**: Order management
- **tables**, **table_sessions**: QR code table tracking with expiration
- **customers**, **customer_order_history**: Customer loyalty
- **stock_inventory**, **stock_movements**: Inventory management

All models have Row Level Security (RLS) enabled in Supabase.

### API Structure

Serverless functions in `api/auth/`:
- `signup.js`: Create new tenant + admin user (bcrypt hashing)
- `signin.js`: Authenticate and create session token
- `signout.js`: Invalidate session
- `session.js`: Verify current session
- `reset-password.js`: Password reset flow

**Security**: Uses bcrypt (12 salt rounds) server-side. Client-side hashing is deprecated. See `SECURE_AUTH_GUIDE.md`.

### Services Layer

`src/lib/supabase.js` exports:
- `supabase`: Supabase client
- `authService`: Auth methods (now uses `directAuthService` from `secureAuthDirect.js`)
- `orderService`: Order CRUD operations
- `menuService`: Menu/product operations (by subdomain or tenant ID)
- `configService`: Tenant settings and tables
- `analyticsService`: Sales metrics and top products
- `customerService`: Customer management
- `utils`: Price/date formatting, QR code generation

## Key Implementation Details

### Subdomain Detection Logic

The `getSubdomain()` function (TenantContext.jsx:10-93) handles:
- Local dev: `.localhost` or `.local` subdomains
- Query param fallback: `?cafe=tenant-name`
- Production: `.tappmesa.com` or `.tappmesa.vercel.app`
- Vercel: Extracts subdomain from `[name]-tappmesa.vercel.app` format (includes `-tappmesa` suffix for DB matching)
- Custom domains: Multi-level subdomain support

### Table QR Code System

Tables have:
- `unique_code`: 8-12 char alphanumeric code (validated with regex `/^[A-Z0-9]{8,12}$/`)
- `qr_code_expires_at`: Optional expiration timestamp (checked before creating session)
- Table sessions track customer orders with `session_code`, `status`, and totals

### Cart System with Temperature Variants

Cart (src/features/cart/) treats items with different temperatures as separate line items:
- Same product + different temp = 2 cart items
- Uses `createCartItem(product, quantity, temperature, notes)` utility
- Calculates 19% Chilean IVA (tax)
- Persists to localStorage with tenant isolation

### Authentication Flow

1. User submits credentials via LoginForm/RegisterForm
2. Frontend calls `authService.signIn()` or `authService.signUp()`
3. API route validates, hashes password (bcrypt), creates session token
4. Token stored in localStorage as `tappmesa-session`
5. AuthContext loads user data and provides to TenantContext
6. TenantContext reloads tenant when `user.tenant_id` changes

**After login**: Automatic subdomain redirect happens in AuthContext (see `AUTH_FIXED_GUIDE.md`).

### Dynamic Branding

TenantContext applies tenant branding (lines 278-284):
- Sets `document.title` to `${tenant.name} - Tappmesa`
- Sets CSS variables `--primary-color` and `--secondary-color`
- Applied dynamically when tenant loads

## Testing

Test setup: `src/test/setup.js` provides:
- jsdom environment
- Mock localStorage
- Mock window.location
- Mock Supabase client factory (`createMockSupabase()`)

**Coverage areas** (see TESTING.md):
- Utility functions: 100% coverage target
- Context providers: 90%+ coverage
- Critical business logic: 100% coverage

**Mock utilities** (`src/test/utils.js`):
- `mockLocation({ hostname, pathname, search })`: Mock URL changes
- `createMockSupabase()`: Factory for Supabase mock
- `mockTenant`, `mockProduct`: Sample data

## Development Notes

### Local Subdomain Development

Use `.localhost` domains (no configuration needed):
```
http://localhost:5173                              # Landing
http://teteria-luna-tappmesa.localhost:5173        # Tenant menu
http://teteria-luna-tappmesa.localhost:5173/admin  # Tenant admin
```

Modern browsers auto-resolve `*.localhost` to `127.0.0.1`.

### Vite Configuration

`vite.config.js` includes:
- Manual chunk splitting for optimal loading (admin, auth, landing, tenant, cart chunks)
- Subdomain host allowlist for HMR
- Vitest config with jsdom environment

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

For production API URL override:
```
VITE_API_BASE_URL=<vercel-deployment-url>
```

### Code Organization

```
src/
├── components/          # Shared UI components
│   ├── admin/          # Admin dashboard components
│   ├── Auth/           # Auth modals/forms
│   ├── Landing/        # Landing page sections
│   ├── common/         # Reusable components (Logo, ContactInfo)
│   └── layout/         # Layout components (Header, MenuLayout)
├── context/            # React Context providers
├── features/           # Feature-based modules
│   ├── cart/          # Cart system (components, hooks, services)
│   ├── menu/          # Menu display and filtering
│   ├── orders/        # Order management
│   └── reservations/  # Reservation system
├── hooks/             # Custom React hooks
├── lib/               # Core libraries (supabase, authService)
├── pages/             # Top-level page components
│   ├── auth/          # Login/Register pages
│   ├── dashboard/     # Admin dashboard
│   └── landing/       # Marketing landing
├── services/          # API service layers
├── store/             # State management (if using Redux)
├── styles/            # Global CSS
├── test/              # Test setup and utilities
└── utils/             # Helper functions
```

### Feature Modules

Features follow a consistent structure:
```
src/features/[feature]/
├── components/        # Feature-specific components
├── hooks/            # Feature-specific hooks
└── services/         # Feature-specific API calls
```

## Important Patterns

### Using TenantContext

```javascript
import { useTenant } from './hooks/useTenant'

const { tenant, loading, error, appType, subdomain, tableCode } = useTenant()
```

**Never access TenantContext directly** - always use the `useTenant` hook for Fast Refresh compatibility.

### Protected Routes

Admin routes use `<ProtectedRoute>` wrapper (src/components/ProtectedRoute.jsx):
```javascript
<Route path="/admin/*" element={
  <ProtectedRoute>
    <SecureAdminApp />
  </ProtectedRoute>
} />
```

### Authenticated API Calls

Use `secureAuthService.authenticatedFetch()`:
```javascript
const response = await secureAuthService.authenticatedFetch('/api/products', {
  method: 'GET'
})
```

Auto-handles session expiration (401) by clearing localStorage and reloading.

## Common Pitfalls

1. **Don't use TenantContext directly** - Use `useTenant()` hook
2. **Table codes are case-sensitive** - Always uppercase alphanumeric
3. **Subdomain in DB must match URL format** - For Vercel: include `-tappmesa` suffix
4. **Tax calculation** - Always 19% (Chilean IVA): `total = subtotal * 1.19`
5. **Test environment vars** - Auto-set to `http://localhost:54321` and `test-anon-key`
6. **Password hashing** - Never hash client-side (deprecated), always use API routes
7. **Session tokens** - Stored as `tappmesa-session` in localStorage
8. **Row Level Security** - All DB operations scoped to tenant_id automatically

## Deployment

Vercel configuration in `vercel.json`:
- Uses pnpm for package management
- Security headers enabled (CSP, XSS protection, frame options)
- SPA rewrites for client-side routing
- Static asset caching (1 year)

**Subdomain configuration**: Each tenant subdomain must be added manually in Vercel domain settings. Vercel auto-generates SSL certificates.

## Migration Notes

The project recently migrated from insecure Base64 password encoding to bcrypt. See `SECURE_AUTH_GUIDE.md` for:
- Migration SQL scripts
- Invalidating old sessions
- Password reset flow
- Breaking changes

All new users automatically use bcrypt. Existing users need password reset.
