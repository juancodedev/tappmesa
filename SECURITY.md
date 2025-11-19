# 🔒 Seguridad - Tappmesa

## ⚠️ Credenciales de Prueba

### Estado Actual

Las credenciales de prueba documentadas en el README son **SOLO PARA DESARROLLO LOCAL**.

### 🔐 Ubicación de las Credenciales

Las credenciales de desarrollo/prueba están **únicamente** en:
- `README.md` - Sección "Credenciales de Prueba"

**NO están expuestas en:**
- Código fuente
- Archivos de configuración
- Base de datos (están hasheadas con bcrypt)
- Repositorio público
 
### 🚨 Acción Requerida para Producción

**ANTES de desplegar a producción, DEBES:**

1. **Cambiar todas las contraseñas** en Supabase
2. **Eliminar usuarios de prueba** que no se usen
3. **Crear usuarios de producción** con contraseñas seguras
4. **Actualizar las credenciales** en tus notas privadas (NO en el repo)

### 📝 Credenciales para Actualizar

#### En la Base de Datos (Supabase)

Ejecutar los siguientes pasos en Supabase SQL Editor:

```sql
-- 1. Verificar usuarios existentes
SELECT email, role FROM admin_users ORDER BY role;

-- 2. Cambiar password del Super Admin
-- Genera un hash bcrypt de tu nueva contraseña
-- Puedes usar: https://bcrypt-generator.com/ (12 rounds)
UPDATE admin_users
SET password_hash = 'tu-nuevo-hash-bcrypt-aqui'
WHERE email = 'superadmin@tappmesa.dev';

-- 3. Cambiar passwords de Tenant Admins
UPDATE admin_users
SET password_hash = 'nuevo-hash-bcrypt'
WHERE role = 'tenant_admin';

-- 4. Eliminar usuarios de prueba (opcional)
DELETE FROM admin_users WHERE email LIKE '%@teteria-luna.dev';
DELETE FROM admin_users WHERE email LIKE '%@coffee-central.dev';
```

#### Nuevas Credenciales Seguras

**Requisitos para contraseñas de producción:**
- Mínimo 12 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos
- No usar palabras del diccionario
- Única por usuario
- Usar un gestor de contraseñas (1Password, LastPass, Bitwarden)

**Ejemplo de contraseña segura:**
```
K9$mPx7!nQ2@vL4#rT8^
```

### 🔑 Gestión de Contraseñas

#### Recomendaciones

1. **Usar un gestor de contraseñas** profesional
2. **Habilitar 2FA** cuando esté disponible
3. **Rotar contraseñas** cada 90 días
4. **No compartir** credenciales por email/chat
5. **Usar contraseñas diferentes** por entorno (dev, staging, prod)

#### Para el Equipo de Desarrollo

**Compartir credenciales de forma segura:**
- ✅ Usar un gestor de contraseñas compartido (1Password Teams, etc.)
- ✅ Cifrar archivos con GPG si es necesario compartir
- ❌ NO enviar por email, Slack, WhatsApp
- ❌ NO commitear al repositorio
- ❌ NO hardcodear en el código

### 🛡️ Checklist de Seguridad Pre-Producción

- [ ] Cambiar password del Super Admin
- [ ] Cambiar passwords de todos los Tenant Admins
- [ ] Eliminar usuarios de prueba no necesarios
- [ ] Verificar que `.env` esté en `.gitignore`
- [ ] Revisar que no haya credenciales en el código
- [ ] Confirmar que `.env.example` solo tenga placeholders
- [ ] Configurar variables de entorno en Vercel (sin exponerlas)
- [ ] Habilitar RLS en todas las tablas de Supabase
- [ ] Revisar políticas de RLS
- [ ] Configurar rate limiting en API routes
- [ ] Habilitar logs de auditoría
- [ ] Revisar CORS y CSP headers

### 📊 Auditoría de Seguridad

#### Usuarios Actuales (para verificar)

```sql
-- Ver todos los usuarios y sus roles
SELECT
  email,
  role,
  is_active,
  created_at,
  last_login
FROM admin_users
ORDER BY role, email;

-- Ver sesiones activas
SELECT
  u.email,
  s.created_at,
  s.expires_at,
  s.ip_address
FROM admin_sessions s
JOIN admin_users u ON u.id = s.user_id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

#### Limpiar Sesiones Antiguas

```sql
-- Eliminar sesiones expiradas
DELETE FROM admin_sessions
WHERE expires_at < NOW();

-- Invalidar todas las sesiones (forzar re-login)
DELETE FROM admin_sessions;
```

### 🚀 Despliegue Seguro

#### Variables de Entorno en Vercel

1. Ir a Vercel Dashboard > Settings > Environment Variables
2. Agregar las siguientes variables:

```
VITE_SUPABASE_URL=tu-url-de-produccion
VITE_SUPABASE_ANON_KEY=tu-anon-key-de-produccion
VITE_API_BASE_URL=https://tu-dominio.vercel.app
```

3. **NUNCA** expongas el Service Role Key en el frontend
4. Usa el Service Role Key **solo** en API routes del servidor

#### Verificar Exposición

Después del deploy, verifica que no se expongan secretos:

```bash
# Ver el código compilado
curl https://tu-app.vercel.app/_next/static/chunks/main-[hash].js | grep -i "supabase\|password\|secret"

# No debe mostrar credenciales reales
```

### 📱 Contacto en Caso de Incidente

Si detectas una brecha de seguridad:

1. **NO** publiques detalles en issues públicos
2. Contacta al equipo de seguridad directamente
3. Cambia inmediatamente las credenciales comprometidas
4. Revisa los logs de acceso
5. Invalida todas las sesiones activas

---

## 🔗 Referencias

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)

---

**Última actualización:** Enero 2025
