/**
 * Input Validation Middleware
 *
 * Middleware para validar y sanitizar entradas de usuario
 * Previene inyecciones y entradas maliciosas
 */

const logger = require('../utils/logger');

// Regex patterns
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-()]{8,20}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericDash: /^[a-zA-Z0-9-_]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  hexColor: /^#[0-9A-F]{6}$/i,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
};

/**
 * Sanitizar string - remover caracteres peligrosos
 */
function sanitizeString(str, options = {}) {
  if (typeof str !== 'string') return str;

  let sanitized = str;

  // Remover caracteres de control
  // eslint-disable-next-line no-control-regex -- intencional: eliminar caracteres de control
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Trim
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Limitar longitud
  if (options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remover HTML tags
  if (options.stripHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Escapar caracteres especiales para SQL/XSS
  if (options.escape) {
    sanitized = sanitized
      .replace(/'/g, "''")
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return sanitized;
}

/**
 * Validar email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email es requerido' };
  }

  const sanitized = sanitizeString(email, { maxLength: 255 }).toLowerCase();

  if (!PATTERNS.email.test(sanitized)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  // Validaciones adicionales
  const [localPart, domain] = sanitized.split('@');

  if (localPart.length > 64) {
    return { valid: false, error: 'Email demasiado largo' };
  }

  if (domain.length > 255) {
    return { valid: false, error: 'Dominio de email inválido' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validar password
 */
function validatePassword(password, options = {}) {
  const minLength = options.minLength || 8;
  const requireUppercase = options.requireUppercase !== false;
  const requireLowercase = options.requireLowercase !== false;
  const requireNumber = options.requireNumber !== false;
  const requireSpecial = options.requireSpecial || false;

  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Contraseña es requerida' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `La contraseña debe tener al menos ${minLength} caracteres` };
  }

  if (password.length > 128) {
    return { valid: false, error: 'La contraseña es demasiado larga' };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos una mayúscula' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos una minúscula' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos un número' };
  }

  // eslint-disable-next-line no-useless-escape -- [ y ] deben escaparse en la clase de caracteres
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'La contraseña debe contener al menos un caracter especial' };
  }

  // Verificar contraseñas comunes débiles
  const weakPasswords = ['password', '12345678', 'qwerty', 'admin', '123456789'];
  if (weakPasswords.includes(password.toLowerCase())) {
    return { valid: false, error: 'Contraseña demasiado débil' };
  }

  return { valid: true, value: password };
}

/**
 * Validar nombre/texto
 */
function validateName(name, options = {}) {
  const minLength = options.minLength || 2;
  const maxLength = options.maxLength || 100;

  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nombre es requerido' };
  }

  const sanitized = sanitizeString(name, { maxLength, stripHtml: true });

  if (sanitized.length < minLength) {
    return { valid: false, error: `Nombre debe tener al menos ${minLength} caracteres` };
  }

  if (sanitized.length > maxLength) {
    return { valid: false, error: `Nombre demasiado largo (máximo ${maxLength} caracteres)` };
  }

  // Solo letras, espacios, y algunos caracteres especiales
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-'.]+$/.test(sanitized)) {
    return { valid: false, error: 'Nombre contiene caracteres inválidos' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validar URL
 */
function validateUrl(url, options = {}) {
  if (!url || typeof url !== 'string') {
    if (options.required === false) {
      return { valid: true, value: null };
    }
    return { valid: false, error: 'URL es requerida' };
  }

  const sanitized = sanitizeString(url, { maxLength: 2048 });

  if (!PATTERNS.url.test(sanitized)) {
    return { valid: false, error: 'URL inválida' };
  }

  // Validar que sea https en producción
  if (process.env.NODE_ENV === 'production' && !sanitized.startsWith('https://')) {
    return { valid: false, error: 'Solo se permiten URLs HTTPS en producción' };
  }

  return { valid: true, value: sanitized };
}

/**
 * Validar número
 */
function validateNumber(value, options = {}) {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { valid: false, error: 'Valor numérico inválido' };
  }

  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: `Valor debe ser mayor o igual a ${options.min}` };
  }

  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: `Valor debe ser menor o igual a ${options.max}` };
  }

  if (options.integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Valor debe ser un número entero' };
  }

  return { valid: true, value: num };
}

/**
 * Middleware de validación de body
 *
 * @param {Object} schema - Schema de validación
 * @example
 * validateBody({
 *   email: { type: 'email', required: true },
 *   password: { type: 'password', required: true, minLength: 8 },
 *   name: { type: 'name', required: false }
 * })
 */
function validateBody(schema) {
  return function(req, res, next) {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Verificar si es requerido
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} es requerido`;
        continue;
      }

      // Si no es requerido y no hay valor, continuar
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Validar según tipo
      let result;
      switch (rules.type) {
        case 'email':
          result = validateEmail(value);
          break;
        case 'password':
          result = validatePassword(value, rules);
          break;
        case 'name':
          result = validateName(value, rules);
          break;
        case 'url':
          result = validateUrl(value, rules);
          break;
        case 'number':
          result = validateNumber(value, rules);
          break;
        default:
          result = { valid: true, value };
      }

      if (!result.valid) {
        errors[field] = result.error;
      } else if (result.value !== undefined) {
        req.body[field] = result.value; // Actualizar con valor sanitizado
      }
    }

    // Si hay errores, retornar 400
    if (Object.keys(errors).length > 0) {
      logger.warn('Validation errors', { errors, body: req.body });
      return res.status(400).json({
        error: 'Errores de validación',
        details: errors
      });
    }

    next();
  };
}

module.exports = {
  validateBody,
  validateEmail,
  validatePassword,
  validateName,
  validateUrl,
  validateNumber,
  sanitizeString,
  PATTERNS
};
