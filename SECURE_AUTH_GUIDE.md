# 🔐 Guía de Autenticación Segura - TappMesa

## ✅ **IMPLEMENTACIÓN COMPLETADA**

### **🎯 Nuevo Sistema de Autenticación Seguro**
- ✅ **bcrypt** implementado en el servidor (12 salt rounds)
- ✅ **API Routes** seguros para auth (`/api/auth/`)
- ✅ **Middleware** de autenticación y autorización
- ✅ **Session management** mejorado
- ✅ **Reset de contraseñas** seguro
- ✅ **Migración** de contraseñas inseguras

---

## 🌟 **Características de Seguridad**

### **✅ Hash Seguro de Contraseñas**
```javascript
// ❌ ANTES (INSEGURO)
btoa(password) // Base64 - facilmente reversible

// ✅ AHORA (SEGURO)
bcrypt.hash(password, 12) // bcrypt con 12 salt rounds
```

### **✅ Autenticación del Lado del Servidor**
```javascript
// API Routes implementados:
POST /api/auth/signup        // Registro seguro
POST /api/auth/signin        // Login seguro
GET  /api/auth/session       // Verificar sesión
POST /api/auth/signout       // Logout seguro
POST /api/auth/reset-password // Reset seguro
```

### **✅ Middleware de Seguridad**
- Verificación de tokens en cada request
- Control de acceso por tenant
- Logs de auditoría automáticos
- Headers de seguridad

---

## 🚀 **URLs de Producción**

### **Frontend**
`https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app`

### **API Endpoints**
```
https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/signup
https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/signin
https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/session
```

---

## 📝 **Pasos para Migrar Usuarios Existentes**

### **1. Ejecutar Script de Migración**
En **Supabase SQL Editor**:
```sql
-- Ejecutar: database/migrate-to-secure-auth.sql
```

### **2. Invalidar Sesiones Existentes**
```sql
-- Se ejecuta automáticamente en el script de migración
SELECT invalidate_all_sessions();
```

### **3. Configurar Reset de Contraseñas**
```sql
-- Ver usuarios que necesitan reset
SELECT * FROM users_needing_password_reset;

-- Generar token de reset para un usuario
SELECT generate_password_reset_token('usuario@email.com');
```

---

## 🔧 **Uso del Nuevo Sistema**

### **Frontend - Nuevo Servicio**
```javascript
import { secureAuthService } from './lib/authService.js';

// Registro
const result = await secureAuthService.signUp({
  email: 'admin@restaurant.com',
  password: 'password123',
  ownerName: 'Juan Pérez',
  restaurantName: 'Café Central',
  numberOfTables: 10
});

// Login
const session = await secureAuthService.signIn(email, password);

// Verificar sesión
const currentUser = await secureAuthService.getCurrentSession();

// Logout
await secureAuthService.signOut();
```

### **API Requests Autenticadas**
```javascript
// Usar wrapper para requests autenticadas
const response = await secureAuthService.authenticatedFetch('/api/admin/products', {
  method: 'GET'
});
```

---

## 🛡️ **Características de Seguridad Implementadas**

### **🔒 Hashing Seguro**
- **bcrypt** con 12 salt rounds
- Hash del lado del servidor
- Verificación segura de contraseñas

### **🎫 Gestión de Sesiones**
- Tokens seguros de 256 bits
- Expiración automática (30 días)
- Invalidación en logout
- Tracking de IP y User-Agent

### **🔐 Reset de Contraseñas**
- Tokens únicos de 256 bits
- Expiración en 24 horas
- Un solo uso por token
- Invalidación de sesiones al reset

### **📋 Auditoría Completa**
- Log de todos los eventos de auth
- Tracking de IPs y dispositivos
- Registro de cambios de contraseña
- Monitoreo de intentos de login

### **🏢 Control Multitenant**
- Acceso restringido por tenant
- Verificación de permisos
- Aislamiento de datos
- Row Level Security

---

## ⚠️ **Cambios Importantes**

### **🚨 Breaking Changes**
1. **Contraseñas existentes invalidadas** - Requieren reset
2. **Sesiones invalidadas** - Requieren nuevo login
3. **API cambió** - Usar `secureAuthService`

### **📧 Acciones Requeridas**
1. Ejecutar script de migración SQL
2. Notificar usuarios para reset de contraseña
3. Actualizar frontend para usar nuevo servicio
4. Configurar emails de reset (opcional)

---

## 🧪 **Testing del Sistema Seguro**

### **1. Registro Nuevo Usuario**
```bash
curl -X POST https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "ownerName": "Test User",
    "restaurantName": "Test Cafe"
  }'
```

### **2. Login Seguro**
```bash
curl -X POST https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Verificar Sesión**
```bash
curl -X GET https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/auth/session \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

## 📈 **Métricas de Seguridad**

### **🔍 Monitoreo Implementado**
- Intentos de login fallidos
- Sesiones creadas/invalidadas
- Resets de contraseña
- Accesos por tenant
- Eventos de auditoría

### **📊 Queries Útiles**
```sql
-- Ver logins recientes
SELECT * FROM admin_audit_logs
WHERE action = 'login'
ORDER BY created_at DESC LIMIT 10;

-- Ver usuarios que necesitan reset
SELECT * FROM users_needing_password_reset;

-- Ver sesiones activas
SELECT count(*) as active_sessions
FROM admin_sessions
WHERE expires_at > NOW();
```

---

## 🎯 **Resultado Final**

### **🚀 Sistema Completamente Seguro**
- ✅ **bcrypt** para contraseñas
- ✅ **Tokens seguros** de sesión
- ✅ **API endpoints** protegidos
- ✅ **Middleware** de autorización
- ✅ **Reset seguro** de contraseñas
- ✅ **Auditoría completa**
- ✅ **Multitenant** seguro

### **🌐 URLs de Producción**
- **App**: `https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app`
- **API**: `https://tappmesa-7lt07xmhc-cljmunoz-gmailcoms-projects.vercel.app/api/`

**¡La autenticación insegura ha sido completamente reemplazada por un sistema robusto y seguro! 🔐**