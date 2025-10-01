# Guía de Aislamiento Multi-Tenant

## 🚨 Problema Identificado

**Síntoma**: Las mesas creadas por una cafetería pueden ser vistas por otras cafeterías.

**Causa Raíz**: Políticas RLS (Row Level Security) demasiado permisivas en PostgreSQL que permiten acceso sin restricciones (`USING (true)`).

---

## ✅ Solución Implementada

### 1. **Script SQL de Corrección**

Ejecutar el script: `database/fix-tables-rls-tenant-isolation.sql`

```bash
# En Supabase SQL Editor
database/fix-tables-rls-tenant-isolation.sql
```

Este script:
- ✅ Elimina políticas RLS permisivas
- ✅ Crea políticas que requieren tenant_id válido
- ✅ Previene creación de mesas sin tenant_id
- ✅ Verifica integridad de datos

### 2. **Validaciones en Código**

El código ahora incluye:

#### **Carga de Mesas** (loadTables)
- ✅ Siempre filtra por `currentTenant.id`
- ✅ Logging detallado del tenant
- ✅ Validación post-carga: verifica que todas las mesas pertenecen al tenant correcto
- ✅ Alerta si se detectan mesas de otros tenants

#### **Creación de Mesas** (handleSaveTable)
- ✅ Asigna explícitamente `tenant_id: currentTenant.id`
- ✅ Logging de datos antes de crear
- ✅ Validación post-creación: verifica tenant_id de la mesa creada
- ✅ Error si el tenant_id no coincide

#### **UI Visual**
- ✅ Indicador del local actual (nombre + ID)
- ✅ Advertencia visual si no hay tenant cargado
- ✅ Prevención de acciones sin tenant

---

## 🔍 Cómo Verificar que el Problema está Resuelto

### Paso 1: Verificar RLS en Supabase

```sql
-- Ver políticas actuales en la tabla tables
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tables';
```

**Resultado esperado**: Deberías ver 4 políticas:
- `tables_select_authenticated`
- `tables_insert_authenticated` (con CHECK tenant_id IS NOT NULL)
- `tables_update_authenticated` (con CHECK tenant_id IS NOT NULL)
- `tables_delete_authenticated`

### Paso 2: Verificar Datos Existentes

```sql
-- Ver todas las mesas y sus tenants
SELECT
  t.id,
  t.number,
  t.tenant_id,
  ten.name as tenant_name
FROM tables t
LEFT JOIN tenants ten ON t.tenant_id = ten.id
ORDER BY t.created_at DESC;
```

**Verificar**:
- ✅ Cada mesa tiene un `tenant_id` válido
- ✅ No hay mesas con `tenant_id = NULL`
- ✅ El `tenant_name` corresponde al local correcto

### Paso 3: Test desde el Admin

1. **Login como Admin del Local A**
   ```
   Email: admin@local-a.com
   ```

2. **Ir a Admin → Mesas**
   - Verificar que el indicador muestre: "Local: [Nombre del Local A]"
   - Abrir la consola del navegador (F12)
   - Buscar el log: `✅ Mesas cargadas para tenant [Nombre del Local A]: X`

3. **Crear una Mesa Nueva**
   - Abrir consola antes de crear
   - Buscar el log: `📝 Creando mesa con datos:`
   - Verificar que `tenant_id` coincide con el del local

4. **Logout y Login como Admin del Local B**
   ```
   Email: admin@local-b.com
   ```

5. **Verificar Aislamiento**
   - ✅ NO deberías ver las mesas del Local A
   - ✅ Solo deberías ver mesas del Local B
   - ✅ El indicador debe mostrar: "Local: [Nombre del Local B]"

### Paso 4: Verificar Logs de Consola

Abrir DevTools Console y buscar:

✅ **Logs esperados (correctos)**:
```
🔍 Cargando mesas para tenant: { tenant_id: "xxx", tenant_name: "Local A" }
✅ Mesas cargadas para tenant Local A: 5
```

🚨 **Logs de alerta (problema)**:
```
🚨 ALERTA DE SEGURIDAD: Se cargaron mesas de otros tenants: [...]
🚨 ALERTA DE SEGURIDAD: Mesa creada con tenant_id incorrecto!
```

---

## 🛠️ Solución de Problemas

### Problema: "Local no identificado"

**Síntoma**: Badge rojo que dice "⚠️ Local no identificado"

**Causas posibles**:
1. Usuario sin `tenant_id` en la base de datos
2. TenantContext no se está cargando correctamente
3. Usuario no autenticado

**Solución**:
```sql
-- Verificar usuario
SELECT id, email, tenant_id, role
FROM admin_users
WHERE email = 'tu-email@ejemplo.com';

-- Si tenant_id es NULL, asignarlo
UPDATE admin_users
SET tenant_id = 'uuid-del-tenant'
WHERE email = 'tu-email@ejemplo.com';
```

### Problema: Veo mesas de otros locales

**Síntoma**: En el admin aparecen mesas que no corresponden al local

**Diagnóstico**:
1. Verificar en consola el log: `🔍 Cargando mesas para tenant:`
2. Ver si aparece el log: `🚨 ALERTA DE SEGURIDAD`

**Solución**:
```sql
-- 1. Verificar RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'tables';
-- rowsecurity debe ser 't' (true)

-- 2. Re-ejecutar script de corrección
-- database/fix-tables-rls-tenant-isolation.sql

-- 3. Verificar que las mesas tienen tenant_id correcto
UPDATE tables
SET tenant_id = 'uuid-correcto'
WHERE id IN ('ids-de-mesas-incorrectas');
```

### Problema: No puedo crear mesas

**Síntoma**: Error al intentar crear una mesa

**Causas posibles**:
1. No hay tenant cargado
2. RLS muy restrictivo
3. Falta tenant_id

**Solución**:
```javascript
// Verificar en consola:
// 1. ¿Hay un badge azul con el nombre del local?
// 2. ¿Aparece el log "📝 Creando mesa con datos:"?

// Si no hay tenant:
// - Verificar que el usuario tiene tenant_id en la BD
// - Re-login para recargar el contexto
```

---

## 📊 Query de Auditoría

Ejecutar esta query para auditar el aislamiento:

```sql
WITH tenant_table_count AS (
  SELECT
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(tb.id) as table_count
  FROM tenants t
  LEFT JOIN tables tb ON t.id = tb.tenant_id
  GROUP BY t.id, t.name
)
SELECT
  tenant_name,
  tenant_id,
  table_count,
  CASE
    WHEN table_count = 0 THEN '⚠️ Sin mesas'
    WHEN table_count < 5 THEN '✓ Pocas mesas'
    ELSE '✓ Con mesas'
  END as status
FROM tenant_table_count
ORDER BY tenant_name;
```

---

## 🔐 Mejores Prácticas

### 1. **Siempre filtrar por tenant_id en queries**
```javascript
// ✅ CORRECTO
const { data } = await supabase
  .from('tables')
  .select('*')
  .eq('tenant_id', currentTenant.id)

// ❌ INCORRECTO
const { data } = await supabase
  .from('tables')
  .select('*')
```

### 2. **Verificar tenant antes de operaciones**
```javascript
if (!currentTenant) {
  console.error('No se puede realizar la operación sin tenant')
  return
}
```

### 3. **Siempre incluir tenant_id al crear**
```javascript
const insertData = {
  tenant_id: currentTenant.id,
  // ... otros campos
}
```

### 4. **Validar datos después de operaciones**
```javascript
// Después de INSERT
if (createdRecord.tenant_id !== currentTenant.id) {
  throw new Error('Error de seguridad: tenant_id incorrecto')
}

// Después de SELECT
const wrongRecords = data.filter(r => r.tenant_id !== currentTenant.id)
if (wrongRecords.length > 0) {
  console.error('Se cargaron registros de otros tenants')
}
```

---

## 📝 Checklist de Verificación

Antes de dar por resuelto el problema, verificar:

- [ ] Script SQL ejecutado sin errores
- [ ] RLS habilitado en tabla `tables`
- [ ] Todas las mesas tienen `tenant_id` válido
- [ ] Todos los usuarios admin tienen `tenant_id` asignado
- [ ] Badge del tenant visible en TablesManager
- [ ] Logs de consola muestran tenant correcto al cargar mesas
- [ ] Logs de consola muestran tenant correcto al crear mesas
- [ ] Test con 2 usuarios de diferentes tenants: cada uno solo ve sus mesas
- [ ] No aparecen alertas de seguridad en consola

---

## 🆘 Soporte

Si después de seguir esta guía aún hay problemas:

1. **Capturar logs de consola** (F12 → Console → copiar todo)
2. **Ejecutar query de auditoría** y compartir resultado
3. **Verificar valores**:
   ```javascript
   // En consola del navegador:
   console.log({
     currentUser: authContext.user,
     currentTenant: tenantContext.tenant
   })
   ```

4. **Compartir output de**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'tables';
   ```
