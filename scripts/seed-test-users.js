// Script para crear usuarios de prueba en Supabase
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase (usar variables de entorno en producción)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

if (!supabaseUrl.startsWith('https://') || !supabaseServiceKey.startsWith('eyJ')) {
  console.error('ERROR: Por favor configura las variables de entorno VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  console.log('Ejemplo:')
  console.log('VITE_SUPABASE_URL=https://tu-proyecto.supabase.co')
  console.log('SUPABASE_SERVICE_ROLE_KEY=eyJ...')
  process.exit(1)
}

// Cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para hashear contraseñas (misma implementación que en supabase.js)
function hashPassword(password) {
  // IMPORTANTE: Esta es una implementación temporal para desarrollo
  // En producción deberías usar bcrypt en el servidor
  return btoa(password)
}

// Datos de los usuarios de prueba
const testUsers = [
  {
    email: 'admin@tappmesa.com',
    password: 'admin123',
    fullName: 'Super Administrador',
    role: 'super_admin',
    tenantData: null // Super admin no tiene tenant específico
  },
  {
    email: 'cafe-central@cafe-central.com',
    password: 'admin123',
    fullName: 'Administrador Café Central',
    role: 'tenant_admin',
    tenantData: {
      name: 'Café Central',
      business_type: 'cafe',
      phone: '+56912345001',
      address: 'Av. Providencia 1234, Santiago',
      numberOfTables: 8
    }
  },
  {
    email: 'teteria-luna@teteria-luna.com',
    password: 'admin123',
    fullName: 'Administrador Tetería Luna',
    role: 'tenant_admin',
    tenantData: {
      name: 'Tetería Luna',
      business_type: 'cafe',
      phone: '+56912345002',
      address: 'Av. Las Condes 5678, Las Condes',
      numberOfTables: 6
    }
  },
  {
    email: 'bistro-sunrise@bistro-sunrise.com',
    password: 'admin123',
    fullName: 'Administrador Bistro Sunrise',
    role: 'tenant_admin',
    tenantData: {
      name: 'Bistro Sunrise',
      business_type: 'restaurant',
      phone: '+56912345003',
      address: 'Av. Vitacura 9012, Vitacura',
      numberOfTables: 12
    }
  },
  {
    email: 'coffee-co@coffee-co.com',
    password: 'admin123',
    fullName: 'Administrador Coffee & Co',
    role: 'tenant_admin',
    tenantData: {
      name: 'Coffee & Co',
      business_type: 'cafe',
      phone: '+56912345004',
      address: 'Av. Ñuñoa 3456, Ñuñoa',
      numberOfTables: 10
    }
  }
]

async function createTenant(tenantData) {
  const tenantSlug = tenantData.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const subdomain = tenantSlug + '-' + Math.random().toString(36).substr(2, 6)

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert([
      {
        name: tenantData.name,
        slug: tenantSlug,
        subdomain: subdomain,
        business_type: tenantData.business_type,
        phone: tenantData.phone,
        email: tenantData.email || '',
        address: tenantData.address,
        description: `${tenantData.name} - Restaurante de prueba`,
        is_active: true
      }
    ])
    .select()
    .single()

  if (tenantError) throw tenantError

  // Crear configuraciones del tenant
  await supabase
    .from('tenant_settings')
    .insert([
      {
        tenant_id: tenant.id,
        table_service_enabled: true,
        takeaway_enabled: true,
        delivery_enabled: false
      }
    ])

  // Crear mesas
  const tables = []
  for (let i = 1; i <= tenantData.numberOfTables; i++) {
    tables.push({
      tenant_id: tenant.id,
      number: i.toString(),
      capacity: 4,
      unique_code: `${tenant.slug}-mesa-${i}`,
      status: 'available'
    })
  }

  await supabase
    .from('tables')
    .insert(tables)

  // Crear categorías por defecto
  const defaultCategories = [
    { name: 'Bebidas Calientes', icon: '☕', display_order: 1 },
    { name: 'Bebidas Frías', icon: '🥤', display_order: 2 },
    { name: 'Comida', icon: '🍽️', display_order: 3 },
    { name: 'Postres', icon: '🍰', display_order: 4 }
  ]

  const categoriesWithTenant = defaultCategories.map(cat => ({
    ...cat,
    tenant_id: tenant.id,
    slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    is_active: true
  }))

  const { data: categories } = await supabase
    .from('categories')
    .insert(categoriesWithTenant)
    .select()

  // Crear productos de ejemplo
  const sampleProducts = [
    { name: 'Café Americano', price: 2500, category_name: 'Bebidas Calientes', description: 'Café negro clásico' },
    { name: 'Cappuccino', price: 3200, category_name: 'Bebidas Calientes', description: 'Café con leche espumosa' },
    { name: 'Latte', price: 3500, category_name: 'Bebidas Calientes', description: 'Café con leche cremosa' },
    { name: 'Jugo Natural', price: 2800, category_name: 'Bebidas Frías', description: 'Jugo de frutas frescas' },
    { name: 'Smoothie', price: 4200, category_name: 'Bebidas Frías', description: 'Batido de frutas' },
    { name: 'Sandwich Completo', price: 5500, category_name: 'Comida', description: 'Sandwich con palta, tomate y mayo' },
    { name: 'Ensalada César', price: 6800, category_name: 'Comida', description: 'Ensalada con pollo y aderezo césar' },
    { name: 'Torta de Chocolate', price: 3800, category_name: 'Postres', description: 'Deliciosa torta casera' },
    { name: 'Cheesecake', price: 4200, category_name: 'Postres', description: 'Tarta de queso con frutos rojos' }
  ]

  for (const product of sampleProducts) {
    const category = categories.find(cat => cat.name === product.category_name)
    if (category) {
      await supabase
        .from('products')
        .insert([
          {
            tenant_id: tenant.id,
            category_id: category.id,
            name: product.name,
            description: product.description,
            price: product.price,
            slug: product.name.toLowerCase().replace(/\s+/g, '-'),
            is_available: true,
            display_order: 1
          }
        ])
    }
  }

  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.subdomain})`)
  return tenant
}

async function createUser(userData) {
  let tenant = null

  // Crear tenant si es necesario
  if (userData.tenantData) {
    tenant = await createTenant(userData.tenantData)
  }

  // Crear usuario admin
  const { data: admin, error: adminError } = await supabase
    .from('admin_users')
    .insert([
      {
        email: userData.email,
        password_hash: hashPassword(userData.password),
        full_name: userData.fullName,
        role: userData.role,
        tenant_id: tenant?.id || null,
        is_active: true
      }
    ])
    .select()
    .single()

  if (adminError) {
    if (adminError.code === '23505') {
      console.log(`⚠️  Usuario ya existe: ${userData.email}`)
      return
    }
    throw adminError
  }

  console.log(`✅ Usuario creado: ${userData.email} (${userData.role})`)

  if (tenant) {
    console.log(`   └── Tenant: ${tenant.name}`)
    console.log(`   └── Subdomain: ${tenant.subdomain}`)
    console.log(`   └── Mesas: ${userData.tenantData.numberOfTables}`)
  }
}

async function seedTestUsers() {
  console.log('🌱 Iniciando creación de usuarios de prueba...\n')

  try {
    // Verificar conexión a Supabase
    const { data, error } = await supabase.from('tenants').select('count').limit(1)
    if (error) {
      throw new Error('Error de conexión a Supabase: ' + error.message)
    }

    console.log('✅ Conexión a Supabase establecida\n')

    // Crear cada usuario
    for (const userData of testUsers) {
      try {
        await createUser(userData)
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message)
      }
    }

    console.log('\n🎉 Proceso completado!')
    console.log('\n📝 Credenciales de prueba creadas:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    testUsers.forEach(user => {
      console.log(`👤 ${user.fullName}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🔑 Password: ${user.password}`)
      console.log(`   🏷️  Role: ${user.role}`)
      if (user.tenantData) {
        console.log(`   🏪 Restaurante: ${user.tenantData.name}`)
      }
      console.log('')
    })

    console.log('💡 Puedes usar estas credenciales para probar la aplicación')

  } catch (error) {
    console.error('❌ Error general:', error.message)
    process.exit(1)
  }
}

// Ejecutar el script
seedTestUsers()