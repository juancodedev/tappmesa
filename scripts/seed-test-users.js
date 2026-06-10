// Script para crear usuarios de prueba en Supabase
// Uso: node scripts/seed-test-users.js
// Requiere: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Configura VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALT_ROUNDS = 12;

const testUsers = [
  {
    email: 'admin@tappmesa.com',
    password: 'admin123',
    fullName: 'Super Administrador',
    role: 'super_admin',
    tenantData: null,
  },
  {
    email: 'cafe-central@cafe-central.com',
    password: 'admin123',
    fullName: 'Administrador Café Central',
    role: 'tenant_admin',
    tenantData: {
      name: 'Café Central',
      businessType: 'cafe',
      phone: '+56912345001',
      address: 'Av. Providencia 1234, Santiago',
      numberOfTables: 8,
    },
  },
  {
    email: 'teteria-luna@teteria-luna.com',
    password: 'admin123',
    fullName: 'Administrador Tetería Luna',
    role: 'tenant_admin',
    tenantData: {
      name: 'Tetería Luna',
      businessType: 'cafe',
      phone: '+56912345002',
      address: 'Av. Las Condes 5678, Las Condes',
      numberOfTables: 6,
    },
  },
  {
    email: 'bistro-sunrise@bistro-sunrise.com',
    password: 'admin123',
    fullName: 'Administrador Bistro Sunrise',
    role: 'tenant_admin',
    tenantData: {
      name: 'Bistro Sunrise',
      businessType: 'restaurant',
      phone: '+56912345003',
      address: 'Av. Vitacura 9012, Vitacura',
      numberOfTables: 12,
    },
  },
  {
    email: 'coffee-co@coffee-co.com',
    password: 'admin123',
    fullName: 'Administrador Coffee & Co',
    role: 'tenant_admin',
    tenantData: {
      name: 'Coffee & Co',
      businessType: 'cafe',
      phone: '+56912345004',
      address: 'Av. Ñuñoa 3456, Ñuñoa',
      numberOfTables: 10,
    },
  },
];

async function createTenant(data) {
  const baseSlug = data.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Verificar si ya existe un tenant con este nombre
  const { data: existing } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('name', data.name)
    .maybeSingle();

  if (existing) {
    console.log(`  ⚠️  Tenant ya existe: ${existing.name} (slug: ${existing.slug})`);
    return existing;
  }

  // Slug único: agregar sufijo si el slug ya existe
  let slug = baseSlug;
  const { count: slugCount } = await supabase
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug);
  if (slugCount > 0) {
    slug = `${baseSlug}-${Date.now().toString(36)}`;
  }

  const subdomain = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
  const uniqueCode = slug.toUpperCase().replace(/-/g, '').slice(0, 8);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .insert({
      name: data.name,
      slug,
      subdomain,
      business_type: data.businessType,
      phone: data.phone,
      address: data.address,
      description: `${data.name} - Restaurante de prueba`,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  // Settings
  await supabase.from('tenant_settings').insert({
    tenant_id: tenant.id,
    table_service_enabled: true,
    takeaway_enabled: true,
    delivery_enabled: false,
  });

  // Mesas
  const tables = Array.from({ length: data.numberOfTables }, (_, i) => ({
    tenant_id: tenant.id,
    number: String(i + 1),
    capacity: 4,
    unique_code: `${uniqueCode}${String(i + 1).padStart(2, '0')}`,
    status: 'available',
    is_active: true,
  }));

  await supabase.from('tables').insert(tables);

  // Categorías
  const { data: categories } = await supabase
    .from('categories')
    .insert([
      { name: 'Bebidas Calientes', icon: '☕', slug: 'bebidas-calientes', display_order: 1, tenant_id: tenant.id, is_active: true },
      { name: 'Bebidas Frías', icon: '🥤', slug: 'bebidas-frias', display_order: 2, tenant_id: tenant.id, is_active: true },
      { name: 'Comida', icon: '🍽️', slug: 'comida', display_order: 3, tenant_id: tenant.id, is_active: true },
      { name: 'Postres', icon: '🍰', slug: 'postres', display_order: 4, tenant_id: tenant.id, is_active: true },
    ])
    .select();

  // Productos
  const products = [
    { name: 'Café Americano', price: 2500, category: 'Bebidas Calientes', desc: 'Café negro clásico' },
    { name: 'Cappuccino', price: 3200, category: 'Bebidas Calientes', desc: 'Café con leche espumosa' },
    { name: 'Latte', price: 3500, category: 'Bebidas Calientes', desc: 'Café con leche cremosa' },
    { name: 'Jugo Natural', price: 2800, category: 'Bebidas Frías', desc: 'Jugo de frutas frescas' },
    { name: 'Smoothie', price: 4200, category: 'Bebidas Frías', desc: 'Batido de frutas' },
    { name: 'Sandwich Completo', price: 5500, category: 'Comida', desc: 'Sandwich con palta, tomate y mayo' },
    { name: 'Ensalada César', price: 6800, category: 'Comida', desc: 'Ensalada con pollo y aderezo césar' },
    { name: 'Torta de Chocolate', price: 3800, category: 'Postres', desc: 'Deliciosa torta casera' },
    { name: 'Cheesecake', price: 4200, category: 'Postres', desc: 'Tarta de queso con frutos rojos' },
  ];

  for (const p of products) {
    const cat = categories.find(c => c.name === p.category);
    if (cat) {
      await supabase.from('products').insert({
        tenant_id: tenant.id,
        category_id: cat.id,
        name: p.name,
        description: p.desc,
        price: p.price,
        slug: p.name.toLowerCase().replace(/\s+/g, '-'),
        is_available: true,
        display_order: 1,
      });
    }
  }

  console.log(`  ✅ Tenant: ${tenant.name} (${slug}) — ${data.numberOfTables} mesas, ${products.length} productos`);
  return tenant;
}

async function seed() {
  console.log('🌱 Sembrando datos de prueba...\n');

  const { error } = await supabase.from('tenants').select('count', { count: 'exact', head: true }).limit(1);
  if (error) {
    console.error('❌ Error de conexión a Supabase:', error.message);
    process.exit(1);
  }
  console.log('✅ Conexión a Supabase OK\n');

  for (const user of testUsers) {
    try {
      let tenant = null;
      if (user.tenantData) {
        tenant = await createTenant(user.tenantData);
      }

      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

      const { error: insertError } = await supabase.from('admin_users').insert({
        email: user.email,
        password_hash: passwordHash,
        full_name: user.fullName,
        role: user.role,
        tenant_id: tenant?.id || null,
        is_active: true,
      });

      if (insertError) {
        if (insertError.code === '23505') {
          console.log(`  ⚠️  Ya existe: ${user.email}`);
        } else {
          throw insertError;
        }
      } else {
        console.log(`  ✅ Usuario: ${user.email} (${user.role})`);
      }
    } catch (err) {
      console.error(`  ❌ Error con ${user.email}:`, err.message);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completado!\n');
  console.log('Credenciales:');
  testUsers.forEach(u => {
    console.log(`  ${u.fullName}: ${u.email} / ${u.password}`);
    if (u.tenantData) console.log(`    → ${u.tenantData.name}`);
  });
  console.log('');
}

seed();
