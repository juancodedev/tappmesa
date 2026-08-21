import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package,
  Search,
  Filter,
  Building2,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminProductsManager = () => {
  const [products, setProducts] = useState([])
  const [tenants, setTenants] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar tenant/filtro
  }, [selectedTenantId, categoryFilter, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load products with filters
      let query = supabase
        .from('products')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          ),
          category:categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_available', statusFilter === 'available')
      }

      const { data: productsData, error: productsError } = await query.limit(500)

      if (productsError) throw productsError

      // Load tenants
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .order('name', { ascending: true })

      // Load categories (all tenants)
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, tenant_id')
        .order('name', { ascending: true })

      setProducts(productsData || [])
      setTenants(tenantsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert(`Error al cargar productos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // Calculate stats
  const stats = {
    total: filteredProducts.length,
    available: filteredProducts.filter(p => p.is_available).length,
    unavailable: filteredProducts.filter(p => !p.is_available).length,
    avgPrice: filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / filteredProducts.length
      : 0
  }

  // Get unique categories for current filtered products
  const availableCategories = selectedTenantId
    ? categories.filter(c => c.tenant_id === selectedTenantId)
    : categories

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando productos...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todos los productos de todos los tenants
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-50 hover:bg-primary-200 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Tenant Selector */}
        <div className="mt-4">
          <TenantSelector
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onTenantChange={setSelectedTenantId}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todas las categorías</option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los estados</option>
            <option value="available">Disponibles</option>
            <option value="unavailable">No disponibles</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">No Disponibles</p>
              <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Precio Promedio</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(stats.avgPrice)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-cream-50 rounded-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron productos</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md border border-primary-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="h-48 bg-primary-50 relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                {!product.is_available && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                    No Disponible
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                {product.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Tenant Info */}
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Building2 className="h-3 w-3 mr-1" />
                  <span className="truncate">{product.tenant?.name}</span>
                </div>

                {/* Category */}
                {product.category && (
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Tag className="h-3 w-3 mr-1" />
                    <span>{product.category.name}</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t border-primary-200">
                  <div className="flex items-center text-orange-600 font-bold">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(product.price)}</span>
                  </div>
                  {product.is_available ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SuperAdminProductsManager
