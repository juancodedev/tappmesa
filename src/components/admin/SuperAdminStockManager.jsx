import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Search,
  RefreshCw,
  Building2,
  CheckCircle,
  XCircle,
  DollarSign,
  BarChart3
} from 'lucide-react'
import TenantSelector from './TenantSelector'

const SuperAdminStockManager = () => {
  const [inventory, setInventory] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [selectedTenantId, stockFilter])

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

      // Load inventory
      let query = supabase
        .from('stock_inventory')
        .select(`
          *,
          product:products (
            id,
            name,
            category:categories (name)
          ),
          tenant:tenants (
            id,
            name,
            slug
          )
        `)
        .order('last_updated', { ascending: false })

      if (selectedTenantId) {
        query = query.eq('tenant_id', selectedTenantId)
      }

      const { data: inventoryData, error: inventoryError } = await query.limit(500)

      if (inventoryError) throw inventoryError

      // Transform data
      const transformedData = (inventoryData || []).map(item => ({
        ...item,
        current_stock: parseFloat(item.current_stock || 0),
        min_stock: parseFloat(item.min_stock || 0),
        max_stock: parseFloat(item.max_stock || 100),
        cost_per_unit: parseFloat(item.cost_per_unit || 0)
      }))

      setInventory(transformedData)
    } catch (error) {
      console.error('Error loading inventory:', error)
      alert('Error al cargar inventario: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (item) => {
    if (item.current_stock <= item.min_stock) {
      return { status: 'low', color: 'bg-red-100 text-red-800', text: 'Stock Bajo', icon: AlertTriangle }
    } else if (item.current_stock >= item.max_stock) {
      return { status: 'full', color: 'bg-blue-100 text-blue-800', text: 'Stock Lleno', icon: CheckCircle }
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'Stock OK', icon: CheckCircle }
    }
  }

  const getStockPercentage = (item) => {
    if (item.max_stock === 0) return 0
    return Math.round((item.current_stock / item.max_stock) * 100)
  }

  const filteredInventory = inventory.filter(item => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        item.product?.name?.toLowerCase().includes(searchLower) ||
        item.product?.category?.name?.toLowerCase().includes(searchLower) ||
        item.tenant?.name?.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false
    }

    // Stock status filter
    if (stockFilter === 'low') {
      return item.current_stock <= item.min_stock
    } else if (stockFilter === 'out') {
      return item.current_stock === 0
    } else if (stockFilter === 'ok') {
      return item.current_stock > item.min_stock && item.current_stock < item.max_stock
    }

    return true
  })

  const getStats = () => {
    const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock)
    const outOfStockItems = inventory.filter(item => item.current_stock === 0)
    const totalValue = inventory.reduce((sum, item) =>
      sum + (item.current_stock * item.cost_per_unit), 0
    )

    return {
      total: inventory.length,
      lowStock: lowStockItems.length,
      outOfStock: outOfStockItems.length,
      totalValue
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount || 0)
  }

  const stats = getStats()

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando inventario...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventario del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Vista global del stock de todos los tenants
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
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Todos los estados</option>
            <option value="low">Stock Bajo</option>
            <option value="out">Sin Stock</option>
            <option value="ok">Stock OK</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lowStock}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sin Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.outOfStock}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredInventory.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay items de inventario</h3>
          <p className="text-gray-600">
            No se encontró inventario con los filtros seleccionados
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min/Max
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item)
                  const percentage = getStockPercentage(item)
                  const StatusIcon = stockStatus.icon

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.product?.name || 'Producto sin nombre'}
                            </div>
                            {item.unit && (
                              <div className="text-xs text-gray-500">
                                Unidad: {item.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.product?.category?.name || 'Sin categoría'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-bold text-gray-900 mr-2">
                            {item.current_stock}
                          </div>
                          <div className="w-16">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  stockStatus.status === 'low' ? 'bg-red-500' :
                                  stockStatus.status === 'full' ? 'bg-blue-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span>{item.min_stock} / {item.max_stock}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {stockStatus.text}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.tenant?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{item.tenant?.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminStockManager
