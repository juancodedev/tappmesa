# 📋 Orden de Ejecución de Scripts SQL

Este documento lista todos los scripts SQL en el orden correcto de ejecución para configurar la base de datos de TappMesa desde cero o actualizar un sistema existente.

---

## 🎯 Ejecución Completa (Sistema Nuevo)

Si estás configurando la base de datos **desde cero**, ejecuta en este orden:

### 1️⃣ Configuración Base de RLS
**Archivo:** `setup-rls.sql`
**Propósito:** Habilitar Row Level Security y crear políticas base
**Cuándo:** Primera vez, después de crear las tablas en Prisma
**Notas:** Define funciones de contexto (get_current_tenant_id, is_tenant_admin)

```bash
# Estado: ⚠️ IMPORTANTE - Algunas políticas están desactualizadas
# Las políticas restrictivas causan problemas, se arreglan después
```

---

### 2️⃣ Funciones del Sistema
**Archivo:** `functions.sql`
**Propósito:** Crear funciones auxiliares para operaciones comunes
**Cuándo:** Después de setup-rls.sql
**Notas:** Funciones para business_hours, reset_password, etc.

```bash
# Estado: ✅ Opcional - El sistema funciona sin estas
```

---

### 3️⃣ Corrección de RLS - Orders
**Archivo:** `fix-rls-orders.sql`
**Propósito:** Arreglar políticas RLS que bloquean actualizaciones de órdenes
**Cuándo:** Después de setup-rls.sql
**Notas:** Reemplaza políticas restrictivas con permisivas

```bash
# Estado: ✅ CRÍTICO - Necesario para que admins actualicen órdenes
```

---

### 4️⃣ Corrección de RLS - Tables
**Archivo:** `fix-rls-tables.sql`
**Propósito:** Arreglar políticas RLS que bloquean actualizaciones de mesas
**Cuándo:** Después de setup-rls.sql
**Notas:** Necesario para migración de códigos QR

```bash
# Estado: ✅ CRÍTICO - Necesario para actualizar códigos de mesas
```

---

### 5️⃣ Corrección de RLS - Customer History
**Archivo:** `fix-rls-customer-history.sql`
**Propósito:** Arreglar políticas RLS para historial de clientes
**Cuándo:** Después de setup-rls.sql
**Notas:** Permite que el sistema registre historial de pedidos

```bash
# Estado: ✅ Recomendado - Para que funcione el historial
```

---

### 6️⃣ Agregar Columnas de QR Expiration
**Archivo:** `add-missing-table-columns.sql`
**Propósito:** Agregar columnas qr_code_generated_at y qr_code_expires_at
**Cuándo:** Antes de usar funciones de QR expiration
**Notas:** ⚠️ IMPORTANTE - Ejecutar este antes que add-qr-expiration.sql

```bash
# Estado: ✅ Recomendado - Para QR codes con expiración
```

---

### 7️⃣ Sistema de Expiración de QR (ALTERNATIVO)
**Archivo:** `add-qr-expiration.sql`
**Propósito:** Agregar funciones y triggers para expiración de QR
**Cuándo:** Después de add-missing-table-columns.sql
**Notas:** ⚠️ Puede duplicar funciones si ya ejecutaste add-missing-table-columns.sql

```bash
# Estado: ⚠️ REDUNDANTE - add-missing-table-columns.sql ya incluye esto
# Solo ejecutar si NO ejecutaste add-missing-table-columns.sql
```

---

### 8️⃣ Sistema de Lealtad (Loyalty)
**Archivo:** `create-loyalty-system.sql`
**Propósito:** Crear tablas y funciones del sistema de fidelización
**Cuándo:** Cuando quieras activar loyalty/cupones/campañas
**Notas:** Crea 7 nuevas tablas (loyalty_programs, coupons, campaigns, etc.)

```bash
# Estado: ✅ Opcional - Solo si vas a usar sistema de fidelización
```

---

### 9️⃣ Migración de Autenticación Segura (SOLO UNA VEZ)
**Archivo:** `migrate-to-secure-auth.sql`
**Propósito:** Migrar de Base64 a bcrypt (usuarios antiguos)
**Cuándo:** Solo si tienes usuarios con passwords en Base64
**Notas:** ⚠️ DESTRUCTIVO - Marca usuarios para password reset

```bash
# Estado: ⚠️ Cuidado - Solo ejecutar si migrando de sistema antiguo
```

---

### 🔟 Corrección de Audit Logs
**Archivo:** `fix-audit-logs.sql`
**Propósito:** Corregir tabla de logs de auditoría
**Cuándo:** Si tienes errores con admin_audit_logs
**Notas:** Opcional, mejora logging de sistema

```bash
# Estado: ✅ Opcional - Para mejorar auditoría
```

---

### 1️⃣1️⃣ Corrección Business Hours Function
**Archivo:** `fix-business-hours-function.sql`
**Propósito:** Arreglar función de horarios de negocio
**Cuándo:** Si usas sistema de reservas
**Notas:** Opcional

```bash
# Estado: ✅ Opcional - Para reservas
```

---

### 1️⃣2️⃣ Corrección Reset Token Function
**Archivo:** `fix-reset-token-function.sql`
**Propósito:** Arreglar función de reset de contraseña
**Cuándo:** Si usas reset de password
**Notas:** Opcional

```bash
# Estado: ✅ Opcional - Para password reset
```

---

## 🚀 Ejecución Rápida (Mínimo Necesario)

Si solo quieres que el sistema funcione **básicamente**, ejecuta estos en orden:

```sql
1. fix-rls-orders.sql         ✅ CRÍTICO
2. fix-rls-tables.sql          ✅ CRÍTICO
3. add-missing-table-columns.sql  ✅ Recomendado
```

---

## 🔄 Ejecución para Actualizar Sistema Existente

Si ya tienes un sistema funcionando y solo quieres agregar features:

### Para QR Codes Mejorados:
```sql
1. fix-rls-tables.sql
2. add-missing-table-columns.sql
```

### Para Sistema de Lealtad:
```sql
1. create-loyalty-system.sql
```

### Para Arreglar Órdenes:
```sql
1. fix-rls-orders.sql
```

---

## 📊 Scripts de Diagnóstico (No Ejecutar - Solo Consulta)

Estos scripts son solo para **consultar** información, no modifican nada:

### ❓ Ver Códigos de Mesa
**Archivo:** `check-table-codes.sql`
**Propósito:** Ver qué formato de código tiene cada mesa
**Cuándo:** Antes de migrar códigos

```sql
-- Solo ejecuta las queries SELECT, no modifica nada
```

---

## 🔧 Scripts de Migración de Datos (Cuidado!)

### ⚠️ Migrar Códigos de Mesa
**Archivo:** `migrate-old-table-codes.sql`
**Propósito:** Actualizar códigos antiguos (coffee-co-mesa-1) a nuevos (ABCD12345678)
**Cuándo:** Después de add-missing-table-columns.sql
**Notas:** ⚠️ DESTRUCTIVO - Invalida QR codes impresos

```sql
# Mejor hacerlo desde el Admin UI en lugar de SQL
# Admin → Mesas → "Actualizar todas"
```

---

## 🧪 Scripts de Prueba (Solo Desarrollo)

### 🎲 Datos de Prueba
**Archivo:** `test-data-sesiones-reservas.sql`
**Propósito:** Insertar datos de prueba para sesiones y reservas
**Cuándo:** Solo en ambiente de desarrollo
**Notas:** No ejecutar en producción

```bash
# Estado: 🧪 Solo para testing
```

---

## ✅ Checklist de Ejecución

### Para Sistema Nuevo (Orden Completo):
- [ ] 1. `setup-rls.sql` (opcional, puede causar problemas)
- [ ] 2. `functions.sql` (opcional)
- [ ] 3. `fix-rls-orders.sql` ✅ **CRÍTICO**
- [ ] 4. `fix-rls-tables.sql` ✅ **CRÍTICO**
- [ ] 5. `fix-rls-customer-history.sql`
- [ ] 6. `add-missing-table-columns.sql` ✅ **Recomendado**
- [ ] 7. `create-loyalty-system.sql` (si vas a usar loyalty)
- [ ] 8. `fix-audit-logs.sql` (opcional)
- [ ] 9. `fix-business-hours-function.sql` (opcional)
- [ ] 10. `fix-reset-token-function.sql` (opcional)

### Para Sistema Existente (Solo Fixes):
- [ ] 1. `fix-rls-orders.sql` ✅ **CRÍTICO**
- [ ] 2. `fix-rls-tables.sql` ✅ **CRÍTICO**
- [ ] 3. `add-missing-table-columns.sql` ✅ **Recomendado**

---

## 🚨 Scripts que NO Debes Ejecutar

### ❌ NO ejecutar en producción:
- `migrate-to-secure-auth.sql` - Solo si migras de sistema antiguo
- `test-data-sesiones-reservas.sql` - Solo datos de prueba
- `migrate-old-table-codes.sql` - Mejor usar UI del admin

### ❌ NO ejecutar múltiples veces:
- `add-qr-expiration.sql` - Redundante con add-missing-table-columns.sql
- `create-loyalty-system.sql` - Causará error si tablas ya existen

---

## 📝 Notas Importantes

1. **RLS Policies:** Los scripts `fix-rls-*.sql` usan políticas permisivas (USING true) porque el frontend ya filtra por tenant_id. Esto es seguro.

2. **QR Columns:** Ejecuta `add-missing-table-columns.sql` en lugar de `add-qr-expiration.sql` (el primero es más completo).

3. **Migración de Códigos:** Mejor usar el Admin UI (Mesas → "Actualizar todas") que el script SQL.

4. **Orden Importa:** Algunos scripts dependen de que otros se hayan ejecutado primero.

---

## 🆘 Si Algo Sale Mal

### Error: "Column already exists"
→ Script ya fue ejecutado, puedes omitirlo

### Error: "Table does not exist"
→ Ejecuta primero `npx prisma db push` para crear tablas

### Error: "Policy already exists"
→ Drop la policy primero o ejecuta el script fix correspondiente

### Error: "Function does not exist"
→ Ejecuta `functions.sql` primero

---

## 📞 Ayuda Rápida

**¿Qué ejecutar ahora?** → `fix-rls-orders.sql` + `fix-rls-tables.sql` + `add-missing-table-columns.sql`

**¿En qué orden?** → El orden de arriba (números 3, 4, 6)

**¿Algo salió mal?** → Comparte el mensaje de error completo