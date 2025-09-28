// Nuevo servicio de autenticación seguro
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD
    ? 'https://tappmesa-8yotnoqfw-cljmunoz-gmailcoms-projects.vercel.app'
    : 'http://localhost:5173'
);

class SecureAuthService {
  constructor() {
    this.sessionToken = localStorage.getItem('tappmesa-session');
  }

  // Registro seguro
  async signUp(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      // Guardar token de sesión
      if (data.sessionToken) {
        localStorage.setItem('tappmesa-session', data.sessionToken);
        this.sessionToken = data.sessionToken;
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta'
      };
    }
  }

  // Inicio de sesión seguro
  async signIn(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el inicio de sesión');
      }

      // Guardar token de sesión
      if (data.sessionToken) {
        localStorage.setItem('tappmesa-session', data.sessionToken);
        this.sessionToken = data.sessionToken;
      }

      return data;
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

      if (!sessionToken) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Sesión inválida, limpiar local storage
        localStorage.removeItem('tappmesa-session');
        this.sessionToken = null;
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Session verification error:', error);
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
        await fetch(`${API_BASE_URL}/api/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          }
        });
      }

      // Limpiar local storage
      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;

      return { success: true };
    } catch (error) {
      console.error('Signout error:', error);
      // Limpiar local storage incluso si falla la petición
      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;
      return { success: false, error: error.message };
    }
  }

  // Obtener token de sesión actual
  getSessionToken() {
    return this.sessionToken || localStorage.getItem('tappmesa-session');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!this.getSessionToken();
  }

  // Headers para peticiones autenticadas
  getAuthHeaders() {
    const token = this.getSessionToken();
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  // Wrapper para peticiones autenticadas
  async authenticatedFetch(url, options = {}) {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Si la respuesta es 401, la sesión expiró
    if (response.status === 401) {
      localStorage.removeItem('tappmesa-session');
      this.sessionToken = null;
      // Recargar la página para redirigir al login
      window.location.reload();
    }

    return response;
  }
}

// Exportar instancia singleton
export const secureAuthService = new SecureAuthService();

// Mantener compatibilidad con el sistema anterior mientras se migra
export const authService = {
  ...secureAuthService,
  // Método legacy para compatibilidad
  async hashPassword(password) {
    console.warn('⚠️  hashPassword is deprecated. Server-side hashing is now used.');
    return password; // El hash se hace en el servidor
  },

  async verifyPassword(password, hash) {
    console.warn('⚠️  verifyPassword is deprecated. Server-side verification is now used.');
    return false; // No verificar en el cliente
  }
};

export default secureAuthService;