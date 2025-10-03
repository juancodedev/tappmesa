// Middleware para resolver tenants basado en subdominios
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import logger from '../utils/logger.js';

export class TenantResolver {
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutos

  static getTenantFromHostname(hostname) {
    // Extraer subdominio
    const parts = hostname.split('.');

    // Si es localhost o no tiene subdominio, retornar null
    if (parts.length < 3 || hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return null;
    }

    // El primer segmento es el subdominio
    const subdomain = parts[0];

    // Ignorar subdominios especiales
    if (['www', 'admin', 'api', 'app'].includes(subdomain)) {
      return null;
    }

    return subdomain;
  }

  static async resolveTenant(subdomain) {
    if (!subdomain) return null;

    // Verificar cache
    const cached = this.cache.get(subdomain);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.tenant;
    }

    try {
      // Buscar tenant en la base de datos
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          subdomain,
          business_type,
          logo_url,
          primary_color,
          secondary_color,
          phone,
          email,
          address,
          description,
          timezone,
          is_active
        `)
        .eq('slug', subdomain)
        .eq('is_active', true)
        .single();

      if (error || !tenant) {
        logger.warn(`Tenant no encontrado para subdominio: ${subdomain}`);
        return null;
      }

      // Guardar en cache
      this.cache.set(subdomain, {
        tenant,
        timestamp: Date.now()
      });

      return tenant;
    } catch (error) {
      logger.error('Error resolviendo tenant:', error);
      return null;
    }
  }

  static async getTenantSettings(tenantId) {
    const cacheKey = `settings_${tenantId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.settings;
    }

    try {
      const { data: settings, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        logger.error('Error obteniendo configuraciones:', error);
        return null;
      }

      // Guardar en cache
      this.cache.set(cacheKey, {
        settings,
        timestamp: Date.now()
      });

      return settings;
    } catch (error) {
      logger.error('Error obteniendo configuraciones:', error);
      return null;
    }
  }

  static clearCache(subdomain = null) {
    if (subdomain) {
      this.cache.delete(subdomain);
      this.cache.delete(`settings_${subdomain}`);
    } else {
      this.cache.clear();
    }
  }

  static async initializeTenantContext(tenantId, userId = null) {
    try {
      // Establecer contexto en Supabase para RLS
      await supabase.rpc('set_tenant_context', {
        tenant_uuid: tenantId,
        user_uuid: userId
      });

      return true;
    } catch (error) {
      logger.error('Error estableciendo contexto de tenant:', error);
      return false;
    }
  }
}

// Hook para usar en React
export function useTenantResolver() {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function resolve() {
      try {
        setLoading(true);
        const hostname = window.location.hostname;
        const subdomain = TenantResolver.getTenantFromHostname(hostname);

        if (!subdomain) {
          setTenant(null);
          setLoading(false);
          return;
        }

        const resolvedTenant = await TenantResolver.resolveTenant(subdomain);

        if (resolvedTenant) {
          // Inicializar contexto de tenant
          await TenantResolver.initializeTenantContext(resolvedTenant.id);
          setTenant(resolvedTenant);
        } else {
          setError('Restaurante no encontrado');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, []);

  return { tenant, loading, error };
}

// Middleware para Express/Node.js (si usas API routes)
export function tenantMiddleware(req, res, next) {
  const hostname = req.get('host') || req.headers.host;
  const subdomain = TenantResolver.getTenantFromHostname(hostname);

  req.subdomain = subdomain;
  req.resolveTenant = () => TenantResolver.resolveTenant(subdomain);

  next();
}

export default TenantResolver;