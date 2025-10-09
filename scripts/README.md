# Scripts de Desarrollo - TappMesa

## 🌱 Seed de Usuarios de Prueba

### Configuración Previa

1. **Variables de Entorno**: Crea un archivo `.env` en la raíz del proyecto con:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu-service-role-key
```

2. **Obtener las Variables**:
   - `VITE_SUPABASE_URL`: En tu panel de Supabase → Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: En tu panel de Supabase → Settings → API → Service Role (secret)

⚠️ **IMPORTANTE**: El Service Role Key tiene permisos completos. Nunca lo expongas en el cliente.

### Ejecución del Script

```bash
# Instalar dependencias si no están instaladas
npm install

# Ejecutar el script de seed
node scripts/seed-test-users.js
```

### ✅ Usuarios que se Crearán

> 🔐 **Las credenciales de prueba están documentadas en el README principal**
>
> Ver: [README.md - Sección Credenciales de Prueba](../README.md#-credenciales-de-prueba)

**El script creará:**

#### Roles incluidos:
- **Super Admin** - Acceso global al sistema
- **Tenant Admins** - Para cada restaurante creado
- **Staff** - Meseros, cocina, etc.

#### Tenants de ejemplo:
- Tetería Luna
- Coffee Central
- Café Central
- Bistro Sunrise
- Coffee & Co

### 🏗️ Datos Adicionales Creados

Para cada restaurante, el script también crea:

- **Configuraciones del tenant** (servicio en mesa, takeaway, etc.)
- **Mesas** con códigos únicos para QR
- **Categorías por defecto**: Bebidas Calientes, Bebidas Frías, Comida, Postres
- **Productos de ejemplo** en cada categoría con precios en CLP

### 🔄 Ejecutar Múltiples Veces

El script es seguro para ejecutar múltiples veces:
- Si un usuario ya existe, mostrará una advertencia pero continuará
- No duplicará datos existentes

### 🐛 Solución de Problemas

#### Error de Conexión
```
Error de conexión a Supabase: ...
```
- Verifica que las variables de entorno estén correctas
- Confirma que tu proyecto de Supabase esté activo

#### Error de Permisos
```
permission denied for table ...
```
- Asegúrate de usar el Service Role Key, no el Anon Key
- Verifica las políticas RLS en Supabase

#### Tablas No Existen
```
relation "tenants" does not exist
```
- Ejecuta las migraciones de la base de datos primero
- Verifica que todas las tablas estén creadas en Supabase

### 📚 Siguiente Paso

Una vez ejecutado el script exitosamente, puedes:

1. **Probar el Login** con cualquiera de las credenciales
2. **Explorar los Menús** de cada restaurante
3. **Generar Códigos QR** para las mesas
4. **Simular Pedidos** usando el sistema

¡Listo para probar tu aplicación! 🚀