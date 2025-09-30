// Servicio de autenticación que usa Supabase directamente mientras se soluciona Vercel
import { supabase } from './supabase.js';

// ⚠️ TEMPORAL: Usar hasta que Vercel API funcione correctamente
class DirectAuthService {
  constructor() {
    this.sessionToken = localStorage.getItem('tappmesa-session');
  }

  // Hash temporal (NO SEGURO - solo para development)
  async tempHashPassword(password) {
    // Usar una función hash más compleja que Base64
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'tappmesa-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Registro usando Supabase directamente
  async signUp(userData) {
    try {
      // Hash temporal de la contraseña
      const passwordHash = await this.tempHashPassword(userData.password);

      // 1. Crear tenant
      const tenantSlug = userData.restaurantName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Usar slug limpio como subdomain (sin sufijos aleatorios)
      // Ejemplo: "Café Central" -> "cafe-central" -> cafe-central.tappmesa.com
      let subdomain = tenantSlug;

      // Verificar si el subdomain ya existe y agregar número si es necesario
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .single();

      if (existingTenant) {
        // Si existe, agregar número secuencial: cafe-central-2, cafe-central-3, etc.
        let counter = 2;
        let newSubdomain;
        do {
          newSubdomain = `${tenantSlug}-${counter}`;
          const { data: check } = await supabase
            .from('tenants')
            .select('subdomain')
            .eq('subdomain', newSubdomain)
            .single();
          if (!check) break;
          counter++;
        } while (counter < 100); // Límite de seguridad
        subdomain = newSubdomain;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            name: userData.restaurantName,
            slug: tenantSlug,
            subdomain: subdomain,
            business_type: userData.restaurantType || 'cafe',
            phone: userData.phone,
            email: userData.email,
            address: userData.address,
            description: `Restaurante ${userData.restaurantName}`,
            is_active: true
          }
        ])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 2. Crear usuario administrador
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .insert([
          {
            email: userData.email,
            password_hash: passwordHash,
            full_name: userData.ownerName,
            role: 'tenant_admin',
            tenant_id: tenantData.id,
            is_active: true,
            needs_password_reset: true // Marcar para migración a bcrypt
          }
        ])
        .select()
        .single();

      if (adminError) {
        // Limpiar tenant si falla
        await supabase.from('tenants').delete().eq('id', tenantData.id);
        throw adminError;
      }

      // 3. Crear configuraciones
      await supabase
        .from('tenant_settings')
        .insert([
          {
            tenant_id: tenantData.id,
            table_service_enabled: true,
            takeaway_enabled: true,
            delivery_enabled: false
          }
        ]);

      // 4. Crear mesas
      const tables = [];
      for (let i = 1; i <= (userData.numberOfTables || 10); i++) {
        tables.push({
          tenant_id: tenantData.id,
          number: i.toString(),
          capacity: 4,
          unique_code: `${tenantData.slug}-mesa-${i}`,
          status: 'available'
        });
      }

      await supabase.from('tables').insert(tables);

      // 5. Crear categorías por defecto
      const defaultCategories = [
        { name: 'Bebidas Calientes', icon: '☕', display_order: 1 },
        { name: 'Bebidas Frías', icon: '🥤', display_order: 2 },
        { name: 'Comida', icon: '🍽️', display_order: 3 },
        { name: 'Postres', icon: '🍰', display_order: 4 }
      ];

      const categoriesWithTenant = defaultCategories.map(cat => ({
        ...cat,
        tenant_id: tenantData.id,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-')
      }));

      await supabase.from('categories').insert(categoriesWithTenant);

      // 6. Crear sesión temporal
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('admin_sessions')
        .insert([
          {
            user_id: adminData.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          }
        ]);

      localStorage.setItem('tappmesa-session', sessionToken);
      this.sessionToken = sessionToken;

      return {
        success: true,
        tenant: tenantData,
        admin: adminData,
        sessionToken,
        warning: 'Usando autenticación temporal. Se requiere migración a bcrypt.'
      };

    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta'
      };
    }
  }

  // Login usando Supabase directamente
  async signIn(email, password) {
    try {
      // Primero obtener el usuario por email
      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select(`
          *,
          tenant:tenants(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (adminError || !admin) {
        return {
          success: false,
          error: 'Email o contraseña incorrectos'
        };
      }

      // Intentar verificar con hash temporal primero (para desarrollo)
      const tempHash = await this.tempHashPassword(password);

      // Si no coincide con el hash temporal, intentar con la password en texto plano
      // (esto es solo para desarrollo mientras se migra completamente)
      if (admin.password_hash !== tempHash && admin.password_hash !== password) {
        return {
          success: false,
          error: 'Email o contraseña incorrectos'
        };
      }

      // Actualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admin.id);

      // Crear sesión
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await supabase
        .from('admin_sessions')
        .insert([
          {
            user_id: admin.id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          }
        ]);

      localStorage.setItem('tappmesa-session', sessionToken);
      this.sessionToken = sessionToken;

      return {
        success: true,
        admin,
        tenant: admin.tenant,
        sessionToken,
        warning: admin.needs_password_reset ? 'Se requiere actualizar contraseña a bcrypt' : null
      };

    } catch (error) {
      console.error('Signin error:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión'
      };
    }
  }

  // Verificar sesión actual
  async getCurrentSession() {
    try {
      const sessionToken = localStorage.getItem('tappmesa-session');
      if (!sessionToken) return null;

      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_user:admin_users(
            *,
            tenant:tenants(*)
          )
        `)
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !session) {
        localStorage.removeItem('tappmesa-session');
        this.sessionToken = null;
        return null;
      }

      return {
        admin: session.admin_user,
        tenant: session.admin_user.tenant,
        sessionToken
      };
    } catch (error) {
      console.error('Session error:', error);
      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;
      return null;
    }
  }

  // Cerrar sesión
  async signOut() {
    try {
      const sessionToken = localStorage.getItem('tappmesa-session');

      if (sessionToken) {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }

      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;
      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;
      return { success: false, error: error.message };
    }
  }

  // Generar token de sesión
  generateSessionToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Métodos de compatibilidad
  getSessionToken() {
    return this.sessionToken || localStorage.getItem('tappmesa-session');
  }

  isAuthenticated() {
    return !!this.getSessionToken();
  }

  getAuthHeaders() {
    const token = this.getSessionToken();
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    return await fetch(url, {
      ...options,
      headers
    });
  }
}

// Exportar instancia
export const directAuthService = new DirectAuthService();
export default directAuthService;