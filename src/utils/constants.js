/**
 * Constantes globales para TappMesa
 */

export const APP_CONFIG = {
  NAME: 'TappMesa',
  VERSION: '1.0.0',
  IVA_PERCENTAGE: 0.19, // 19% IVA en Chile
};

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  STAFF: 'staff',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  PAID: 'paid',
};

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
};

export const REGEX = {
  // Códigos de mesa: 8-12 chars alfanumérico mayúscula
  TABLE_CODE: /^[A-Z0-9]{8,12}$/,
  // Subdominios válidos
  SUBDOMAIN: /^[a-z0-9-]+$/,
};

export const STORAGE_KEYS = {
  SESSION: 'tappmesa-session',
  CART: 'tappmesa-cart',
  THEME: 'tappmesa-theme',
};

export const CONTACT_INFO = {
  SUPPORT_EMAIL: 'soporte@tappmesa.com',
  SALES_EMAIL: 'ventas@tappmesa.com',
  PHONE: '+56 9 1234 5678',
};
