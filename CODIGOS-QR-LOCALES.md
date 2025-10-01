# Usar Códigos QR en Desarrollo Local

## 🎯 Problema Resuelto

Los códigos QR no funcionaban en desarrollo local porque el sistema tiene **dos formatos** de códigos de mesa:

### Formato Antiguo (generado en signup)
```
coffee-co-mesa-1
teteria-luna-mesa-2
bistro-sunrise-mesa-3
```
- Minúsculas, guiones, sufijo `-mesa-N`
- Generados automáticamente al crear cuenta

### Formato Nuevo (generado en admin)
```
ABCD12345678
XYZ9876543
HGJK2345RTYU
```
- Solo mayúsculas y números
- 8-12 caracteres
- Más seguros
- Generados al crear mesas manualmente

**Ahora ambos formatos funcionan** ✅

---

## 🧪 Probar Localmente

### URLs de Ejemplo (con formato antiguo):

```bash
# Tetería Luna - Mesa 1
http://teteria-luna-tappmesa.localhost:5173/teteria-luna-mesa-1/

# Coffee & Co - Mesa 1
http://coffee-co-tappmesa.localhost:5173/coffee-co-mesa-1/

# Bistro Sunrise - Mesa 1
http://bistro-sunrise-tappmesa.localhost:5173/bistro-sunrise-mesa-1/

# Café Central - Mesa 1
http://cafe-central-tappmesa.localhost:5173/cafe-central-mesa-1/
```

### URLs de Ejemplo (con formato nuevo):

Primero necesitas crear mesas con códigos nuevos desde el admin:
1. Ve a: `http://teteria-luna-tappmesa.localhost:5173/admin/tables`
2. Crea una nueva mesa
3. Se generará un código como: `HGJK2345RTYU`
4. Úsalo así: `http://teteria-luna-tappmesa.localhost:5173/HGJK2345RTYU/`

---

## ⚠️ Importante: No Olvides el Puerto

En desarrollo local **SIEMPRE** incluye `:5173`:

```bash
✅ CORRECTO:
http://teteria-luna-tappmesa.localhost:5173/coffee-co-mesa-1/

❌ INCORRECTO (sin puerto):
http://teteria-luna-tappmesa.localhost/coffee-co-mesa-1/
```

---

## 🔍 Ver Códigos de Tus Mesas

### Opción 1: Desde Supabase
1. Abre: https://supabase.com/dashboard
2. Ve a: Table Editor → tables
3. Busca la columna `unique_code`

### Opción 2: Desde el Admin
1. Ve a: `http://teteria-luna-tappmesa.localhost:5173/admin/tables`
2. Verás todos los códigos QR de tus mesas
3. Puedes copiar el código o el link completo

### Opción 3: SQL Query
```sql
SELECT number, unique_code, tenant_id
FROM tables
WHERE tenant_id = 'ID-DE-TU-TENANT'
ORDER BY number;
```

---

## 🔄 Migrar Códigos Antiguos a Nuevos

Si quieres actualizar tus mesas de formato antiguo a nuevo:

```sql
-- Ver códigos antiguos
SELECT id, number, unique_code
FROM tables
WHERE unique_code LIKE '%-mesa-%';

-- Actualizar con códigos nuevos (ejemplo para una mesa)
UPDATE tables
SET unique_code = 'ABCD12345678',
    qr_code_generated_at = NOW(),
    qr_code_expires_at = NULL
WHERE id = 'ID-DE-LA-MESA';
```

O desde el Admin:
1. Ve a Gestión de Mesas
2. Edita la mesa
3. El sistema mantendrá el código antiguo (no regenera automáticamente)

---

## 🐛 Troubleshooting

### Error: "Mesa no encontrada"

**Causa:** El código no existe en la base de datos

**Solución:**
1. Verifica que el código existe:
   ```sql
   SELECT * FROM tables WHERE unique_code = 'coffee-co-mesa-1';
   ```
2. Si no existe, créalo desde el admin
3. Verifica que `tenant_id` coincida con el tenant del subdomain

### Error: "QR Code expired"

**Causa:** El código tiene fecha de expiración pasada

**Solución:**
```sql
-- Ver códigos expirados
SELECT number, unique_code, qr_code_expires_at
FROM tables
WHERE qr_code_expires_at < NOW();

-- Eliminar expiración
UPDATE tables
SET qr_code_expires_at = NULL
WHERE unique_code = 'TU-CODIGO';
```

### Error: Página en blanco / No carga

**Causa 1:** Falta el puerto `:5173`
```bash
❌ http://teteria-luna-tappmesa.localhost/codigo/
✅ http://teteria-luna-tappmesa.localhost:5173/codigo/
```

**Causa 2:** Servidor dev no está corriendo
```bash
# Verificar que el servidor está corriendo
npm run dev
```

**Causa 3:** Subdomain incorrecto
```bash
❌ http://teteria-luna.localhost:5173/codigo/
✅ http://teteria-luna-tappmesa.localhost:5173/codigo/
```

---

## 🎨 Generar QR Images Localmente

Para generar imágenes QR de tus códigos locales:

```bash
# URL para generar QR (usa api.qrserver.com)
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=http://teteria-luna-tappmesa.localhost:5173/coffee-co-mesa-1/
```

O desde el admin:
1. Ve a: Admin → QR Codes
2. Selecciona la mesa
3. Descarga el QR como PNG

**Nota:** Los QR generados con URLs locales solo funcionarán desde tu computadora. Para producción usa las URLs de Vercel.

---

## ✅ Checklist de Verificación

- [ ] Servidor dev corriendo (`npm run dev`)
- [ ] Puerto 5173 incluido en URL
- [ ] Subdomain correcto (incluye `-tappmesa`)
- [ ] Código de mesa existe en base de datos
- [ ] Código coincide con tenant correcto
- [ ] No hay fecha de expiración (o no está vencida)
- [ ] Tabla está activa (`is_active = true`)

---

## 📝 Ejemplos Completos

### Ejemplo 1: Acceder con código antiguo
```bash
# 1. Abrir el navegador en:
http://teteria-luna-tappmesa.localhost:5173/teteria-luna-mesa-1/

# 2. Deberías ver:
✅ Logo de Tetería Luna
✅ Menú con productos
✅ "Mesa: Mesa 1" en la parte superior
✅ Carrito funcionando

# 3. Console logs esperados (F12):
🌐 Hostname: teteria-luna-tappmesa.localhost
🏢 App Type: table
🔑 Subdomain: teteria-luna-tappmesa
🪑 Table code detected: teteria-luna-mesa-1 (old format)
✅ Tenant loaded: Tetería Luna
✅ Table loaded: Mesa 1
```

### Ejemplo 2: Acceder con código nuevo
```bash
# 1. Crear mesa nueva desde admin
# 2. Copiar código generado (ej: HGJK2345RTYU)
# 3. Abrir:
http://teteria-luna-tappmesa.localhost:5173/HGJK2345RTYU/

# 4. Console logs:
🪑 Table code detected: HGJK2345RTYU (new format)
```

---

**¿Problemas?** Abre la consola del navegador (F12) y busca mensajes que empiecen con 🪑, 🌐, 🏢, 🔑, o ✅ para ver qué está pasando.