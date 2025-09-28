// Middleware global para API routes
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/api/auth/signup',
  '/api/auth/signin',
  '/api/public/',
  '/api/menu/public',
  '/api/health'
];

// Rutas que requieren autenticación pero son accesibles por cualquier usuario autenticado
const AUTHENTICATED_ROUTES = [
  '/api/auth/session',
  '/api/auth/signout',
  '/api/user/profile'
];

// Rutas que requieren permisos específicos de tenant
const TENANT_PROTECTED_ROUTES = [
  '/api/admin/',
  '/api/tenant/',
  '/api/orders/',
  '/api/products/',
  '/api/categories/',
  '/api/customers/',
  '/api/tables/',
  '/api/reservations/',
  '/api/analytics/'
];

export default async function middleware(req, res, next) {
  // Permitir CORS para desarrollo
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Agregar headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const pathname = req.url;

  // Verificar si es una ruta pública
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return next();
  }

  // Extraer token de autorización
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    // Verificar sesión en la base de datos
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        *,
        admin_user:admin_users(
          id,
          email,
          full_name,
          role,
          tenant_id,
          is_active,
          tenant:tenants(*)
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session || !session.admin_user.is_active) {
      return res.status(401).json({ error: 'Sesión inválida o expirada' });
    }

    // Agregar información del usuario a la request
    req.user = session.admin_user;
    req.tenant = session.admin_user.tenant;
    req.sessionToken = sessionToken;

    // Verificar permisos para rutas protegidas por tenant
    if (TENANT_PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!req.tenant) {
        return res.status(403).json({ error: 'Acceso denegado: tenant no encontrado' });
      }

      // Verificar que el usuario pertenece al tenant correcto
      const tenantIdFromPath = extractTenantIdFromPath(pathname);
      if (tenantIdFromPath && tenantIdFromPath !== req.tenant.id) {
        return res.status(403).json({ error: 'Acceso denegado: tenant incorrecto' });
      }
    }

    // Actualizar último acceso (opcional, para estadísticas)
    supabase
      .from('admin_sessions')
      .update({ last_access: new Date().toISOString() })
      .eq('session_token', sessionToken)
      .then(); // Fire and forget

    return next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Función auxiliar para extraer tenant ID de la ruta
function extractTenantIdFromPath(pathname) {
  // Ejemplo: /api/admin/tenants/123/products -> 123
  const tenantMatch = pathname.match(/\/api\/[^\/]+\/tenants\/([^\/]+)/);
  return tenantMatch ? tenantMatch[1] : null;
}

// Función para verificar permisos específicos
export function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Super admins tienen todos los permisos
      if (user.role === 'super_admin') {
        return next();
      }

      // Verificar permisos en la base de datos
      const { data: permission } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', user.role)
        .eq('resource', resource)
        .eq('action', action)
        .single();

      if (!permission) {
        return res.status(403).json({
          error: `Acceso denegado: se requiere permiso ${action} en ${resource}`
        });
      }

      return next();

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
}

// Función para verificar roles específicos
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const { user } = req;

    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Acceso denegado: se requiere uno de los roles: ${allowedRoles.join(', ')}`
      });
    }

    return next();
  };
}