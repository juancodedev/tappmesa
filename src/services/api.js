/**
 * Cliente API base
 */
import logger from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const session = localStorage.getItem('tappmesa-session');
    if (session) {
      headers['Authorization'] = `Bearer ${session}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      logger.error(`API Error [${url}]:`, error);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(body) 
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};
