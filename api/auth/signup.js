// API Route: /api/auth/signup.js
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');
const { rateLimiter, blacklistMiddleware } = require('../middleware/rateLimit');
const { corsMiddleware } = require('../middleware/cors');
const { validatePassword } = require('../middleware/validation');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Usar service role key para operaciones privilegiadas
);

// Validación de email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitización de subdomain
function sanitizeSubdomain(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .substring(0, 50); // Límite de longitud
}

module.exports = async function handler(req, res) {
  // CORS
  if (corsMiddleware(req, res, ['POST', 'OPTIONS'])) {
    return;
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Blacklist check
  if (blacklistMiddleware(req, res)) {
    return;
  }

  // Rate limiting
  const rateLimit = rateLimiter('auth/signup');
  if (await rateLimit(req, res)) {
    return;
  }

  try {
    const {
      email,
      password,
      ownerName,
      restaurantName,
      restaurantType = 'cafe',
      phone,
      address,
      city,
      numberOfTables = 10
    } = req.body;

    // Validaciones básicas
    if (!email || !password || !ownerName || !restaurantName) {
      return res.status(400).json({
        error: 'Campos requeridos: email, password, ownerName, restaurantName'
      });
    }

    // Validar formato de email
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: passwordValidation.error
      });
    }

    // Validar longitudes máximas
    if (email.length > 255 || ownerName.length > 100 || restaurantName.length > 100) {
      return res.status(400).json({
        error: 'Uno o más campos exceden la longitud máxima permitida'
      });
    }

    // Verificar si el email ya existe
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({
        error: 'El email ya está registrado'
      });
    }

    // Hash seguro de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 1. Crear tenant (restaurante)
    const tenantSlug = sanitizeSubdomain(restaurantName);

    // Generar subdomain único con sufijo aleatorio
    const subdomain = tenantSlug + '-' + Math.random().toString(36).substr(2, 6);

    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([
        {
          name: restaurantName,
          slug: tenantSlug,
          subdomain: subdomain,
          business_type: restaurantType,
          phone: phone,
          email: email,
          address: address,
          description: `Restaurante ${restaurantName}${city ? ` ubicado en ${city}` : ''}`,
          is_active: true
        }
      ])
      .select()
      .single();

    if (tenantError) {
      throw new Error(`Error creando restaurante: ${tenantError.message}`);
    }

    // 2. Crear usuario administrador del tenant
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          email: email,
          password_hash: passwordHash, // Hash seguro
          full_name: ownerName,
          role: 'tenant_admin',
          tenant_id: tenantData.id,
          is_active: true
        }
      ])
      .select()
      .single();

    if (adminError) {
      // Si falla, eliminar el tenant creado
      await supabase.from('tenants').delete().eq('id', tenantData.id);
      throw new Error(`Error creando usuario: ${adminError.message}`);
    }

    // 3. Crear configuraciones del tenant
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
    for (let i = 1; i <= numberOfTables; i++) {
      tables.push({
        tenant_id: tenantData.id,
        number: i.toString(),
        capacity: 4,
        unique_code: `${tenantData.slug}-mesa-${i}`,
        status: 'available'
      });
    }

    await supabase
      .from('tables')
      .insert(tables);

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

    await supabase
      .from('categories')
      .insert(categoriesWithTenant);

    // 6. Crear sesión inicial
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días (reducido de 30 para mejor seguridad)

    await supabase
      .from('admin_sessions')
      .insert([
        {
          user_id: adminData.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        }
      ]);

    // Retornar datos sin información sensible
    const response = {
      success: true,
      tenant: {
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        subdomain: tenantData.subdomain,
        business_type: tenantData.business_type
      },
      admin: {
        id: adminData.id,
        email: adminData.email,
        full_name: adminData.full_name,
        role: adminData.role
      },
      sessionToken,
      trialInfo: {
        endDate: expiresAt,
        daysLeft: 60
      }
    };

    res.status(201).json(response);

  } catch (error) {
    logger.error('Signup error', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
}

function generateSessionToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}