# 🔒 Mejoras de Seguridad Implementadas

Este documento resume todas las mejoras de seguridad aplicadas al proyecto TappMesa.

## 📋 Resumen Ejecutivo

Se implementaron mejoras críticas de seguridad que incluyen:
- ✅ Sistema de logging condicional (producción segura)
- ✅ Rate limiting en endpoints de autenticación
- ✅ Validación y sanitización robusta de inputs
- ✅ CORS configurado con whitelist
- ✅ Security headers mejorados (CSP, HSTS)
- ✅ Servicio de email para password reset
- ✅ Sesiones reducidas a 7 días

---

## 🎯 Mejoras Implementadas

### 1. **Sistema de Logging Condicional** ✅

**Archivos creados:**
- `src/utils/logger.js` - Logger frontend
- `api/utils/logger.js` - Logger backend

**Uso:**
```javascript
// Frontend
import logger from './utils/logger'
logger.dev('Info de desarrollo')  // Solo en DEV
logger.error('Error crítico')     // Siempre visible

// Backend (API)
const logger = require('../utils/logger')
logger.audit('user_login', userId, details)
logger.security('suspicious_activity', data)
```

**Beneficios:**
- Logs sensibles NO aparecen en producción
- Errores siempre se registran
- Auditoría de eventos de seguridad

---

### 2. **Rate Limiting** ✅

**Archivo:** `api/middleware/rateLimit.js`

**Configuración actual:**
- **Login**: 5 intentos / 15 minutos
- **Registro**: 3 intentos / 1 hora
- **Password Reset**: 3 intentos / 15 minutos

**Uso en API route:**
```javascript
const { rateLimiter, blacklistMiddleware } = require('../middleware/rateLimit')

module.exports = async function handler(req, res) {
  // Blacklist check
  if (blacklistMiddleware(req, res)) return;

  // Rate limiting
  const rateLimit = rateLimiter('auth/signin');
  if (rateLimit(req, res)) return;

  // ... resto del código
}
```

**⚠️ Nota importante:**
El rate limiter actual usa memoria (se resetea en cada deploy). Para **producción real**, se recomienda:
- [Vercel Rate Limiting](https://vercel.com/docs/security/rate-limiting)
- [Upstash Redis](https://upstash.com/)

---

### 3. **Validación de Inputs** ✅

**Archivo:** `api/middleware/validation.js`

**Validaciones implementadas:**
- ✅ Email con regex + longitud
- ✅ Password: mínimo 8 chars (antes 6)
- ✅ Nombres: sin HTML tags, caracteres especiales
- ✅ URLs: solo HTTPS en producción
- ✅ Subdomain sanitizado (max 50 chars)

**Ejemplo de uso:**
```javascript
const { validateBody } = require('../middleware/validation')

// Aplicar validación
router.post('/api/endpoint', validateBody({
  email: { type: 'email', required: true },
  password: { type: 'password', required: true, minLength: 8 },
  name: { type: 'name', maxLength: 100 }
}), handler);
```

**Mejoras en signup.js:**
```javascript
// Validación de email agregada
if (!EMAIL_REGEX.test(email)) {
  return res.status(400).json({ error: 'Formato de email inválido' });
}

// Contraseña aumentada a 8 caracteres
if (password.length < 8) {
  return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
}

// Límites de longitud
if (email.length > 255 || ownerName.length > 100 || restaurantName.length > 100) {
  return res.status(400).json({ error: 'Uno o más campos exceden la longitud máxima' });
}

// Subdomain sanitizado
const tenantSlug = sanitizeSubdomain(restaurantName);
```

---

### 4. **CORS Middleware** ✅

**Archivo:** `api/middleware/cors.js`

**Origins permitidos:**
- `http://localhost:5173` (desarrollo)
- `https://tappmesa.vercel.app`
- `https://*.tappmesa.vercel.app` (subdominios)
- `https://*.tappmesa.com` (producción)

**Agregar dominio personalizado:**
```javascript
// api/middleware/cors.js
const ALLOWED_ORIGINS = [
  'https://midominio.com',
  // ... resto
];
```

---

### 5. **Security Headers** ✅

**Archivo modificado:** `vercel.json`

**Headers agregados:**
```json
{
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' ...",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()"
}
```

**Protecciones:**
- ✅ HSTS: Force HTTPS (2 años)
- ✅ CSP: Previene XSS
- ✅ Frame protection: Previene clickjacking
- ✅ XSS Protection habilitado

---

### 6. **Servicio de Email** ✅

**Archivo:** `api/services/emailService.js`

**Proveedores soportados:**
- SendGrid
- Resend
- Console (desarrollo)

**Configuración:**

1. **Instalar proveedor:**
```bash
npm install @sendgrid/mail
# O
npm install resend
```

2. **Variables de entorno:**
```bash
EMAIL_PROVIDER=sendgrid  # o 'resend'
SENDGRID_API_KEY=tu_api_key
# O
RESEND_API_KEY=tu_api_key
FROM_EMAIL=noreply@tappmesa.com
FROM_NAME=TappMesa
FRONTEND_URL=https://tuppmesa.com
```

3. **Descomentar provider en emailService.js:**
```javascript
// Descomentar sección de SendGrid o Resend
async function sendViaSendGrid(to, subject, html, text) {
  // ...
}
```

**Emails implementados:**
- ✅ Password reset (con token)
- ✅ Welcome email (registro exitoso)

**Uso:**
```javascript
const { sendEmail, getPasswordResetEmail } = require('../services/emailService')

const { subject, html } = getPasswordResetEmail(userName, resetUrl, 60)
const result = await sendEmail(email, subject, html)
```

---

### 7. **Sesiones Reducidas** ✅

**Antes:** 30 días
**Ahora:** 7 días

**Archivos modificados:**
- `api/auth/signin.js`
- `api/auth/signup.js`

**Razón:** Reduce ventana de tiempo para sesiones comprometidas.

**Próximo paso recomendado:** Implementar refresh tokens para renovación automática.

---

### 8. **Invalidación de Sesiones** ✅

**Implementado en:**
- `api/auth/reset-password.js` (líneas 211-215)

**Funcionalidad:**
Cuando un usuario cambia su contraseña, **todas sus sesiones activas se invalidan automáticamente**.

```javascript
// Invalidar todas las sesiones del usuario por seguridad
await supabase
  .from('admin_sessions')
  .delete()
  .eq('user_id', resetToken.user.id);
```

---

## 🚀 Próximos Pasos Recomendados

### Alta Prioridad

1. **Configurar email provider real**
   - Crear cuenta en SendGrid/Resend
   - Agregar API key a `.env`
   - Descomentar provider en `emailService.js`

2. **Implementar rate limiting con Redis**
   - Crear cuenta en Upstash
   - Reemplazar `Map()` con Redis en `rateLimit.js`

3. **Testing de seguridad**
   - Probar todos los endpoints con rate limiting
   - Verificar que CSP no bloquee funcionalidad
   - Testear password reset flow completo

### Media Prioridad

4. **Refresh tokens**
   - Implementar sistema de refresh tokens
   - Permitir renovación de sesiones sin re-login

5. **2FA (Two-Factor Authentication)**
   - Agregar autenticación de dos factores
   - TOTP con Google Authenticator

6. **Monitoreo con Sentry**
   - Integrar Sentry para tracking de errores
   - Alertas automáticas de errores críticos

### Baja Prioridad

7. **Audit logs dashboard**
   - Panel para visualizar logs de auditoría
   - Alertas de actividad sospechosa

8. **Password policy**
   - Requerir mayúsculas, números, caracteres especiales
   - Prevenir reutilización de passwords

---

## 📊 Métricas de Seguridad

### Antes
- ❌ Tokens expuestos en logs
- ❌ Sin rate limiting
- ❌ Sesiones de 30 días
- ❌ Contraseña mínima: 6 chars
- ❌ Sin validación de email
- ⚠️ Logs en producción

### Después
- ✅ Tokens seguros
- ✅ Rate limiting: 5 intentos/15min
- ✅ Sesiones de 7 días
- ✅ Contraseña mínima: 8 chars
- ✅ Validación completa de inputs
- ✅ Logs solo en desarrollo
- ✅ CSP + HSTS headers
- ✅ CORS configurado
- ✅ Email service listo

---

## 🔧 Configuración de Entorno

**Variables de entorno necesarias:**

```bash
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# Email (opcional - usar console mode si no está configurado)
EMAIL_PROVIDER=console  # o 'sendgrid', 'resend'
SENDGRID_API_KEY=tu_key  # si usas SendGrid
RESEND_API_KEY=tu_key    # si usas Resend
FROM_EMAIL=noreply@tappmesa.com
FROM_NAME=TappMesa

# Frontend
FRONTEND_URL=https://tappmesa.com  # o http://localhost:5173

# Node
NODE_ENV=production  # o 'development'

# Seguridad (opcional)
BLACKLISTED_IPS=1.2.3.4,5.6.7.8  # IPs bloqueadas
```

---

## 📝 Notas Adicionales

### Logs de desarrollo en archivos

Los emails en modo desarrollo se guardan en `.temp-emails/` para facilitar testing.

```bash
# Ver emails de desarrollo
ls .temp-emails/
cat .temp-emails/email-*.html
```

### Rate Limiting Stats

Puedes obtener estadísticas del rate limiter:

```javascript
const { getStats } = require('./api/middleware/rateLimit')
console.log(getStats())
```

### Resetear rate limit (testing)

```javascript
const { resetLimit } = require('./api/middleware/rateLimit')
resetLimit('auth/signin', '192.168.1.1')
```

---

## 🐛 Troubleshooting

**CSP bloquea scripts:**
- Ajustar CSP en `vercel.json`
- Agregar dominios necesarios a `script-src` o `connect-src`

**Rate limit falsos positivos:**
- Verificar IP del cliente (proxies, load balancers)
- Ajustar límites en `rateLimit.js`

**Emails no se envían:**
- Verificar `EMAIL_PROVIDER` en `.env`
- Confirmar API key válida
- Revisar logs del email service

**CORS errors:**
- Agregar dominio a `ALLOWED_ORIGINS` en `cors.js`
- Verificar que el origin se envía en headers

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vercel Security Best Practices](https://vercel.com/docs/security/security-best-practices)
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Rate Limiting Strategies](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Fecha de implementación:** {{ FECHA }}
**Versión:** 1.0.0
**Status:** ✅ Producción Ready (con configuración de email provider)
