# Configuración de Subdominios en Desarrollo Local

Este documento explica cómo configurar tu entorno de desarrollo local para que funcione con subdominios, permitiendo probar el flujo completo de login y redirección.

## 🎯 Objetivo

Que cuando hagas login con una cuenta de tenant (ej: `teteria-luna@teteria-luna.com`), seas redirigido automáticamente a `teteria-luna-tappmesa.localhost:5173/admin`.

## 🛠️ Configuración

### Opción 1: Usar .localhost (Recomendado - Más Simple)

Los navegadores modernos resuelven automáticamente `*.localhost` a `127.0.0.1`. No necesitas configurar nada adicional.

**Ventajas:**
- ✅ No requiere configuración del sistema
- ✅ Funciona en Chrome, Firefox, Edge, Safari
- ✅ Resolución automática a 127.0.0.1

**URLs de ejemplo:**
```
http://localhost:5173                              → Login general
http://teteria-luna-tappmesa.localhost:5173/admin  → Admin Tetería Luna
http://bistro-sunrise-tappmesa.localhost:5173/admin → Admin Bistro Sunrise
http://coffee-co-tappmesa.localhost:5173/admin     → Admin Coffee & Co
```

**Cómo usar:**
1. Inicia tu servidor de desarrollo: `npm run dev`
2. Abre tu navegador en `http://localhost:5173`
3. Haz login con cualquier cuenta de tenant
4. Serás redirigido automáticamente al subdominio correcto

---

### Opción 2: Configurar archivo hosts (Desarrollo avanzado)

Si prefieres usar dominios personalizados como `.local` en lugar de `.localhost`:

#### macOS / Linux:

1. Edita el archivo hosts:
   ```bash
   sudo nano /etc/hosts
   ```

2. Agrega estas líneas al final:
   ```
   127.0.0.1   tappmesa.local
   127.0.0.1   teteria-luna-tappmesa.local
   127.0.0.1   bistro-sunrise-tappmesa.local
   127.0.0.1   coffee-co-tappmesa.local
   127.0.0.1   cafe-central-tappmesa.local
   ```

3. Guarda y cierra (Ctrl+O, Enter, Ctrl+X)

4. Limpia el cache DNS:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Linux
   sudo systemctl restart systemd-resolved
   ```

#### Windows:

1. Abre el Bloc de notas como Administrador

2. Abre el archivo: `C:\Windows\System32\drivers\etc\hosts`

3. Agrega estas líneas al final:
   ```
   127.0.0.1   tappmesa.local
   127.0.0.1   teteria-luna-tappmesa.local
   127.0.0.1   bistro-sunrise-tappmesa.local
   127.0.0.1   coffee-co-tappmesa.local
   127.0.0.1   cafe-central-tappmesa.local
   ```

4. Guarda el archivo

5. Limpia el cache DNS (PowerShell como Admin):
   ```powershell
   ipconfig /flushdns
   ```

**URLs de ejemplo con .local:**
```
http://tappmesa.local:5173                       → Login general
http://teteria-luna-tappmesa.local:5173/admin    → Admin Tetería Luna
http://bistro-sunrise-tappmesa.local:5173/admin  → Admin Bistro Sunrise
```

---

## 🧪 Probar el Sistema

### 1. Verificar Subdominios

Abre estas URLs en tu navegador para verificar que funcionan:

```bash
# Con .localhost (no requiere configuración)
http://localhost:5173
http://teteria-luna-tappmesa.localhost:5173
http://bistro-sunrise-tappmesa.localhost:5173

# Con .local (requiere configurar /etc/hosts)
http://tappmesa.local:5173
http://teteria-luna-tappmesa.local:5173
http://bistro-sunrise-tappmesa.local:5173
```

### 2. Probar el Login y Redirección

#### Escenario 1: Login desde localhost
1. Abre: `http://localhost:5173`
2. Haz login con: `teteria-luna@teteria-luna.com` / `admin123`
3. Deberías ser redirigido a: `http://teteria-luna-tappmesa.localhost:5173/admin`
4. Verifica que estás en el admin de Tetería Luna

#### Escenario 2: Login desde subdomain incorrecto
1. Abre: `http://bistro-sunrise-tappmesa.localhost:5173`
2. Haz login con: `teteria-luna@teteria-luna.com` / `admin123`
3. Deberías ser redirigido a: `http://teteria-luna-tappmesa.localhost:5173/admin`
4. El sistema te mueve al subdomain correcto

#### Escenario 3: Login en subdomain correcto
1. Abre: `http://teteria-luna-tappmesa.localhost:5173`
2. Haz login con: `teteria-luna@teteria-luna.com` / `admin123`
3. Deberías navegar a: `http://teteria-luna-tappmesa.localhost:5173/admin`
4. NO hay redirección completa, solo navegación interna (más rápido)

---

## 📋 Cuentas de Prueba

```
Email: teteria-luna@teteria-luna.com
Password: admin123
Subdomain: teteria-luna-tappmesa

Email: bistro-sunrise@bistro-sunrise.com
Password: admin123
Subdomain: bistro-sunrise-tappmesa

Email: coffee-co@coffee-co.com
Password: admin123
Subdomain: coffee-co-tappmesa

Email: cafe-central@cafe-central.com
Password: admin123
Subdomain: cafe-central-tappmesa
```

---

## 🔧 Troubleshooting

### Problema: "No se puede acceder al sitio"

**Solución con .localhost:**
- Verifica que estás usando `.localhost` (no `.local`)
- Prueba en modo incógnito
- Prueba otro navegador

**Solución con .local:**
- Verifica que editaste correctamente el archivo hosts
- Asegúrate de tener privilegios de administrador
- Limpia el cache DNS
- Reinicia el navegador

### Problema: Redirección en loop

**Causa:** El subdomain en la base de datos no coincide con el esperado

**Solución:**
1. Abre la consola del navegador (F12)
2. Busca los logs que empiezan con 🔄 o 🔍
3. Verifica que `targetSubdomain` coincida con el hostname
4. Si no coincide, actualiza la base de datos:

```sql
-- Actualizar subdomain de un tenant
UPDATE tenants
SET subdomain = 'teteria-luna-tappmesa'
WHERE slug = 'teteria-luna';
```

### Problema: CORS errors

**Causa:** Tu servidor Vite no acepta requests desde subdominios

**Solución:** Agrega esta configuración en `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    host: true, // Permite conexiones desde subdominios
    port: 5173
  }
})
```

---

## 🚀 Producción (Vercel)

En producción con Vercel, el formato es diferente:

```
https://tappmesa.vercel.app                    → App principal
https://teteria-luna-tappmesa.vercel.app/admin → Tetería Luna
https://bistro-sunrise-tappmesa.vercel.app/admin → Bistro Sunrise
```

**Nota:** En Vercel, cada subdomain debe ser configurado manualmente en los settings del proyecto:
1. Ve a: https://vercel.com/[tu-usuario]/tappmesa/settings/domains
2. Agrega cada subdomain como un dominio separado
3. Vercel generará automáticamente el certificado SSL

---

## 📚 Recursos Adicionales

- [RFC 2606 - Reserved TLDs](https://tools.ietf.org/html/rfc2606) - `.localhost` es un TLD reservado
- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)

---

## ✅ Checklist de Configuración

- [ ] Servidor de desarrollo corriendo en puerto 5173
- [ ] Puedes acceder a `http://localhost:5173`
- [ ] Puedes acceder a `http://teteria-luna-tappmesa.localhost:5173`
- [ ] Login redirige correctamente al subdomain del tenant
- [ ] La consola del navegador muestra los logs 🔄 y 🔍
- [ ] No hay errores CORS
- [ ] El admin panel carga correctamente después del login

---

**¿Tienes problemas?** Revisa los logs en la consola del navegador. Los mensajes con emojis (🔄, 🔍, ✅, 📍) te indicarán exactamente qué está pasando en cada paso del login.