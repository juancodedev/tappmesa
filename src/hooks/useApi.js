/**
 * Hook para realizar llamadas a API con estado de carga y error
 */
import { useState, useCallback } from 'react';
import logger from '../utils/logger';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response);
      return response;
    } catch (err) {
      const message = err.message || 'Error en la petición';
      setError(message);
      logger.error('API Request Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, request, setData };
}
