# Configuración de Supabase - Nuevas Tablas

Este documento explica cómo ejecutar las migraciones necesarias para el sistema de suscripciones y pre-cuentas.

## 📋 Tablas que se Crearán

### Nuevas Tablas:
1. **subscription_plans** - Planes de suscripción configurables
2. **tenant_subscriptions** - Suscripciones de cada tenant
3. **pre_bills** - Pre-cuentas generadas
4. **surveys** - Configuración de encuestas
5. **survey_responses** - Respuestas de encuestas

### Tablas Modificadas:
- **tenants** - Agrega `tip_percentage` y `show_survey`
- **tables** - Agrega `max_capacity`
- **table_sessions** - Agrega `waiter_name`, `guest_count`, `opened_at`

## 🚀 Cómo Ejecutar la Migración

### Opción 1: Usar el Editor SQL de Supabase (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral, selecciona **SQL Editor**
3. Haz clic en **New Query**
4. Copia todo el contenido del archivo `supabase-migrations.sql`
5. Pégalo en el editor
6. Haz clic en **Run** o presiona `Ctrl/Cmd + Enter`

### Opción 2: Usar la CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db push --db-url "tu-connection-string"
```

## ✅ Verificar la Migración

Después de ejecutar el script, verifica que todo esté correcto:

```sql
-- Verificar que las tablas existan
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'subscription_plans',
  'tenant_subscriptions',
  'pre_bills',
  'surveys',
  'survey_responses'
);

-- Verificar planes de ejemplo
SELECT * FROM subscription_plans;

-- Verificar nuevas columnas en tenants
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tenants'
AND column_name IN ('tip_percentage', 'show_survey');
```

## 📊 Planes de Ejemplo Incluidos

La migración crea 4 planes de ejemplo:

1. **Plan Básico** - $0 (5 mesas, 20 productos)
2. **Plan Estándar** - $29.990 (10 mesas, 50 productos)
3. **Plan Pro** - $59.990 (25 mesas, 150 productos)
4. **Plan Enterprise** - $99.990 (100 mesas, 500 productos)

## 🔒 Políticas de Seguridad (RLS)

El script configura automáticamente Row Level Security:

- **SuperAdmin**: Acceso completo a todas las tablas
- **Tenant Admin**: Solo puede ver/editar datos de su tenant
- **Público**: Puede enviar respuestas de encuestas

## 🛠️ Troubleshooting

### Error: "relation already exists"
No hay problema, algunas tablas ya existen. El script usa `IF NOT EXISTS`.

### Error: "permission denied"
Asegúrate de estar usando una cuenta con privilegios de administración en Supabase.

### Error: "column already exists"
Algunas columnas ya fueron agregadas previamente. El script usa `IF NOT EXISTS`.

## 📝 Después de la Migración

Una vez completada la migración:

1. **Refresca la página del admin**: `http://localhost:5173/admin/tenants`
2. **Verifica que cargue sin errores**
3. **Crea tu primer plan** en `/admin/subscription-plans`
4. **Asigna un plan a un tenant** en `/admin/tenants`

## 🔄 Rollback (Deshacer cambios)

Si necesitas deshacer la migración:

```sql
-- ⚠️ CUIDADO: Esto eliminará todas las tablas y datos

DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS pre_bills CASCADE;
DROP TABLE IF EXISTS tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Eliminar columnas agregadas
ALTER TABLE tenants
  DROP COLUMN IF EXISTS tip_percentage,
  DROP COLUMN IF EXISTS show_survey;

ALTER TABLE tables
  DROP COLUMN IF EXISTS max_capacity;

ALTER TABLE table_sessions
  DROP COLUMN IF EXISTS waiter_name,
  DROP COLUMN IF EXISTS guest_count,
  DROP COLUMN IF EXISTS opened_at;
```

## 📚 Más Información

- Ver `prisma/schema.prisma` para el modelo completo de datos
- Ver `src/services/planLimitsService.js` para lógica de límites
- Ver `src/services/preBillService.js` para lógica de pre-cuentas
