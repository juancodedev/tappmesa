import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Tag,
  Package,
  Building2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminCategoriesManager = () => {
  const [categories, setCategories] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar tenant/filtro
  }, [selectedTenantId, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name')

      if (tenantsError) throw tenantsError
      setTenants(tenantsData || [])

      // Load categories with product count
      let query = supabase
        .from('categories')
        .select(`
          *,
          tenant:tenants (
            id,
            name,
            slug
          ),
          products (count)
        `)
        .order('created_at', { ascending: false })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      const { data: categoriesData, error: categoriesError } = await query.limit(500)

      if (categoriesError) throw categoriesError

      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      alert('Error al cargar categorías: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter((category) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      category.name?.toLowerCase().includes(searchLower) ||
      category.slug?.toLowerCase().includes(searchLower) ||
      category.tenant?.name?.toLowerCase().includes(searchLower)
    )
  })

  const getStats = () => {
    return {
      total: filteredCategories.length,
      active: filteredCategories.filter(c => c.is_active).length,
      withProducts: filteredCategories.filter(c => c.products && c.products[0]?.count > 0).length,
      mostUsed: filteredCategories.reduce((max, c) => {
        const count = c.products?.[0]?.count || 0
        return count > (max.products?.[0]?.count || 0) ? c : max
      }, filteredCategories[0] || {})
    }
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando categorías...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorías del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global de todas las categorías de productos
            </p>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categorías</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Tag className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Productos</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.withProducts}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Más Usada</p>
              <p className="text-lg font-bold text-orange-600 mt-1 truncate">
                {stats.mostUsed?.name || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {stats.mostUsed?.products?.[0]?.count || 0} productos
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
          <p className="text-gray-600">
            No se encontraron categorías con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => {
            const productCount = category.products?.[0]?.count || 0

            return (
              <div
                key={category.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Tag className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        /{category.slug}
                      </p>
                    </div>
                  </div>

                  {category.is_active ? (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activa
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactiva
                    </div>
                  )}
                </div>

                {/* Tenant */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="font-medium text-gray-900">{category.tenant?.name}</div>
                      <div className="text-xs text-gray-500">@{category.tenant?.slug}</div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-600">{productCount}</div>
                    <div className="text-xs text-gray-600">Productos</div>
                  </div>

                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-gray-900">
                      {category.display_order !== null ? category.display_order : '-'}
                    </div>
                    <div className="text-xs text-gray-600">Orden</div>
                  </div>
                </div>

                {/* Description if exists */}
                {category.description && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SuperAdminCategoriesManager
