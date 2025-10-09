# SuperAdmin Tenant Selector - Guía de Uso

## Resumen de Cambios

Se ha implementado un sistema de selección de tenants para las vistas de SuperAdmin, permitiendo filtrar los datos por tenant específico o ver todos los tenants juntos.

## Componentes Actualizados

### 1. Nuevo Componente: `TenantSelector`
**Ubicación:** `src/components/admin/TenantSelector.jsx`

Componente reutilizable que proporciona:
- Selector dropdown de tenants
- Indicador visual del tenant seleccionado
- Badge "Vista Global" cuando se muestran todos los tenants
- Badge con nombre del tenant cuando se filtra por uno específico

### 2. Componentes SuperAdmin Actualizados

Los siguientes componentes ahora incluyen el TenantSelector:

#### `SuperAdminOrdersManager.jsx`
- **Ruta:** `/admin/all-orders`
- **Funcionalidad:**
  - Ver todos los pedidos del sistema
  - Filtrar por tenant específico
  - Filtros adicionales: búsqueda, estado, fecha
  - Estadísticas actualizadas según filtros

#### `SuperAdminProductsManager.jsx`
- **Ruta:** `/admin/all-products`
- **Funcionalidad:**
  - Ver todos los productos del sistema
  - Filtrar por tenant específico
  - Filtros adicionales: búsqueda, categoría, disponibilidad
  - Las categorías se actualizan según el tenant seleccionado

#### `SuperAdminTablesManager.jsx`
- **Ruta:** `/admin/all-tables`
- **Funcionalidad:**
  - Ver todas las mesas del sistema
  - Filtrar por tenant específico
  - Filtros adicionales: búsqueda, estado
  - Información de QR codes y capacidad

## Cómo Usar el Tenant Selector

### Vista Global (Todos los Tenants)
1. Acceder a cualquier vista SuperAdmin (ej: `/admin/all-orders`)
2. Por defecto, se muestra "🌍 Todos los Tenants"
3. Se visualizan datos de TODOS los tenants mezclados
4. Badge azul indica "Vista Global"

### Vista de Tenant Específico
1. Usar el selector dropdown "Vista:"
2. Seleccionar un tenant de la lista
3. Los datos se filtran automáticamente para mostrar solo ese tenant
4. Badge naranja muestra el nombre del tenant seleccionado
5. Para volver a vista global, seleccionar "🌍 Todos los Tenants"

## Características Técnicas

### Estado del Selector
- **Variable de estado:** `selectedTenantId`
- **Valor null:** Vista global (todos los tenants)
- **Valor UUID:** Filtra por ese tenant específico

### Filtrado Dinámico
- Los datos se recargan automáticamente al cambiar el tenant
- Las consultas SQL incluyen filtro `WHERE tenant_id = ?` cuando se selecciona un tenant
- Sin filtro cuando `selectedTenantId` es null

### Cascada de Filtros
En `SuperAdminProductsManager`, las categorías se actualizan dinámicamente:
```javascript
const availableCategories = selectedTenantId
  ? categories.filter(c => c.tenant_id === selectedTenantId)
  : categories
```

## Solución al Error "No existe tenant"

### Problema Original
SuperAdmin no tiene un tenant asociado (subdomain), pero algunos componentes esperaban tener acceso a un tenant, causando errores como "no existe tenant".

### Solución Implementada
1. **TenantContext:** Correctamente establece `tenant = null` para SuperAdmin global
2. **Componentes SuperAdmin:** No dependen de TenantContext, cargan datos directamente
3. **Tenant Selector:** Permite seleccionar qué tenant ver, sin depender de subdomain
4. **Filtrado Explícito:** Los filtros se aplican por ID de tenant, no por contexto

## Ventajas del Nuevo Sistema

### Para SuperAdmin
✅ Vista global de todos los datos del sistema
✅ Capacidad de "zoom in" en un tenant específico
✅ Cambio rápido entre tenants sin cambiar URL
✅ Interfaz clara que indica qué se está visualizando
✅ No depende de subdomains o contexto de tenant

### Para Desarrollo
✅ Componente reutilizable (`TenantSelector`)
✅ Patrón consistente en todos los managers SuperAdmin
✅ Fácil de extender a nuevos componentes
✅ Estado local simplificado (`selectedTenantId`)

## Próximos Pasos Sugeridos

Para completar la suite SuperAdmin, se pueden agregar vistas globales para:

- [ ] **Reservations** (reservas) - `/admin/all-reservations`
- [ ] **Customers** (clientes) - `/admin/all-customers`
- [ ] **Categories** (categorías) - `/admin/all-categories`
- [ ] **Stock** (inventario) - `/admin/all-stock`
- [ ] **QR Codes** - integrado en tablas, pero podría tener vista separada

Cada uno seguiría el mismo patrón:
1. Importar `TenantSelector`
2. Estado `selectedTenantId`
3. Filtrado condicional en queries
4. UI con selector prominente

## Acceso a las Vistas

### URL para SuperAdmin (sin subdomain)
```
http://localhost:5173/admin/all-orders
http://localhost:5173/admin/all-products
http://localhost:5173/admin/all-tables
```

### Navegación
Las rutas están en el menú lateral bajo la sección de SuperAdmin:
- Todos los Pedidos
- Todos los Productos
- Todas las Mesas

## Notas Importantes

⚠️ **Permisos:** Solo usuarios con rol `super_admin` tienen acceso
⚠️ **Performance:** Se limita a 200-500 registros para evitar sobrecarga
⚠️ **RLS:** Row Level Security debe estar configurado correctamente en Supabase
⚠️ **Tenant Context:** SuperAdmin global NO tiene tenant en contexto (esto es correcto)

## Debugging

### Error "no existe tenant"
Si aparece este error:
1. Verificar que estás accediendo desde URL sin subdomain (ej: `localhost:5173/admin`)
2. Revisar en consola que `appType === 'admin'`
3. Confirmar que el usuario tiene rol `super_admin`
4. Verificar que no hay validaciones de tenant en componentes SuperAdmin

El error podría venir de:
- Componentes tenant-specific mal accedidos (`/admin/orders` vs `/admin/all-orders`)
- Middleware o context esperando tenant cuando no debe
- Componentes usando `useTenant()` cuando no lo necesitan

### Error "Could not find a relationship between 'orders' and 'tables'"
Este error ocurre cuando se intenta hacer un JOIN que no está configurado en Supabase.

**Solución implementada:**
- Se usa el campo `table_number` directamente de la tabla `orders`
- No se hace JOIN con la tabla `tables`
- Se muestra "Para llevar" cuando `table_number` es null

**Alternativa (si necesitas más datos de tables):**
1. En Supabase, ir a Table Editor > orders
2. Verificar que existe la columna `table_id` como foreign key
3. Asegurarse que la relación está habilitada
4. Esperar a que Supabase regenere el schema cache

### Error "column order_items_1.subtotal does not exist"
Este error ocurre porque la columna se llama `total_price`, no `subtotal`.

**Solución implementada:**
- Cambiado `subtotal` por `total_price` en el query de order_items
- La tabla `order_items` tiene las columnas:
  - `id` - UUID
  - `quantity` - Integer
  - `unit_price` - Decimal(10,2)
  - `total_price` - Decimal(10,2) ← usar esta
  - `notes` - String opcional
