/**
 * Validadores comunes para el sistema
 */
import { REGEX } from './constants';

export const validateTableCode = (code) => {
  if (!code) return false;
  return REGEX.TABLE_CODE.test(code);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validateSubdomain = (subdomain) => {
  if (!subdomain) return false;
  // Excluir palabras reservadas
  const reserved = ['www', 'admin', 'api', 'app', 'mail', 'ftp', 'tappmesa', 'localhost'];
  return REGEX.SUBDOMAIN.test(subdomain) && !reserved.includes(subdomain.toLowerCase());
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

export const calculateTax = (subtotal) => {
  return subtotal * 0.19;
};

export const calculateTotal = (subtotal) => {
  return subtotal * 1.19;
};
