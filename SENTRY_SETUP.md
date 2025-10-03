# 🔍 Configuración de Sentry

Sentry está integrado en TappMesa para monitoreo de errores y performance en producción.

## 📋 Configuración

### 1. Crear cuenta en Sentry

1. Ir a [sentry.io](https://sentry.io) y crear cuenta
2. Crear un nuevo proyecto tipo "React"
3. Copiar el DSN que te proporciona Sentry

### 2. Variables de Entorno

Agregar a tu archivo `.env`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://tu-dsn@o123456.ingest.sentry.io/123456
VITE_APP_VERSION=1.0.0
```

**Importante:** El DSN debe empezar con `VITE_` para que Vite lo exponga al navegador.

### 3. Despliegue en Vercel

En la configuración de tu proyecto en Vercel, agregar las variables de entorno:

1. Ir a Settings → Environment Variables
2. Agregar:
   - `VITE_SENTRY_DSN` = tu DSN de Sentry
   - `VITE_APP_VERSION` = versión de tu app (ej: 1.0.0)

## 🎯 Características Implementadas

### Error Boundary

- ✅ Captura errores de React automáticamente
- ✅ UI amigable para el usuario cuando hay errores
- ✅ Envío automático a Sentry en producción
- ✅ Muestra detalles del error solo en desarrollo

### Performance Monitoring

- ✅ Tracking de transacciones (100% sample rate)
- ✅ Browser tracing integration
- ✅ Mide tiempos de carga y navegación

### Session Replay

- ✅ Graba 10% de sesiones normales
- ✅ Graba 100% de sesiones con errores
- ✅ Enmascara texto y media sensible

### Logger Integration

El logger personalizado envía errores a Sentry:

```javascript
import logger from './utils/logger'

// Error normal (solo producción)
logger.error(error, 'Context info')

// Error crítico (siempre)
logger.critical(error, 'Critical context')
```

## 🔧 Configuración Avanzada

### Ajustar Sample Rates

En `src/main.jsx`, puedes ajustar:

```javascript
Sentry.init({
  tracesSampleRate: 0.1,        // 10% de transacciones (reducir en prod)
  replaysSessionSampleRate: 0.1, // 10% de sesiones normales
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
})
```

### Filtrar Errores

Ya se filtran errores de extensiones del navegador. Para agregar más filtros:

```javascript
beforeSend(event, hint) {
  // Tu lógica de filtrado
  if (shouldIgnoreError(event)) {
    return null; // No enviar a Sentry
  }
  return event;
}
```

### Source Maps (Opcional)

Para ver código fuente en Sentry, configurar en `vite.config.js`:

```javascript
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  build: {
    sourcemap: true, // Habilitar source maps
  },
  plugins: [
    sentryVitePlugin({
      org: 'tu-org',
      project: 'tappmesa',
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
})
```

Agregar a `.env`:
```bash
SENTRY_AUTH_TOKEN=tu_token_de_sentry
```

## 📊 Uso

### Capturar Errores Manualmente

```javascript
import * as Sentry from '@sentry/react'

try {
  // Código que puede fallar
} catch (error) {
  Sentry.captureException(error, {
    level: 'error',
    extra: {
      userId: user.id,
      context: 'payment_processing'
    }
  })
}
```

### Capturar Mensajes

```javascript
Sentry.captureMessage('Algo inesperado sucedió', 'warning')
```

### Breadcrumbs (Contexto)

```javascript
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
})
```

### Tags y Context

```javascript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
})

Sentry.setTag('tenant_id', tenant.id)
Sentry.setContext('tenant', {
  id: tenant.id,
  name: tenant.name,
  subdomain: tenant.subdomain,
})
```

## 🚨 Best Practices

1. **No enviar datos sensibles**
   - Session Replay enmascara automáticamente
   - Filtrar información sensible en `beforeSend`

2. **Usar niveles apropiados**
   - `fatal`: Errores críticos que hacen crash
   - `error`: Errores importantes
   - `warning`: Advertencias
   - `info`: Información general

3. **Agregar contexto**
   - Siempre agregar información útil para debugging
   - User ID, Tenant ID, acción que se estaba realizando

4. **Sample rates en producción**
   - Reducir `tracesSampleRate` a 0.1 (10%) para reducir costos
   - Mantener `replaysOnErrorSampleRate` en 1.0

## 🔒 Seguridad

- ✅ DSN es público y seguro de exponer
- ✅ Solo funciona en producción (`import.meta.env.PROD`)
- ✅ No se envían logs en desarrollo
- ✅ Datos sensibles enmascarados automáticamente

## 📈 Monitoreo

En el dashboard de Sentry verás:

- **Issues**: Errores agrupados por tipo
- **Performance**: Tiempos de carga y transacciones
- **Releases**: Tracking de versiones
- **Session Replay**: Grabaciones de sesiones con errores

## 🧪 Testing

Para probar Sentry en desarrollo:

```javascript
// En la consola del navegador
throw new Error('Test Sentry error')

// O desde código
import * as Sentry from '@sentry/react'
Sentry.captureException(new Error('Test error'))
```

## 📝 Recursos

- [Sentry React Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
