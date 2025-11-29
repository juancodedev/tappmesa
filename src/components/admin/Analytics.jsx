import { useState, useEffect } from 'react'
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  Search,
  Filter,
  Edit,
  History
} from 'lucide-react'

const StockManager = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      
      // Datos de ejemplo - en producción cargaríamos desde Supabase
      setInventory([
        {
          id: 1,
          product: { id: 1, name: 'Café Espresso', category: 'Bebidas' },
          current_stock: 50,
          min_stock: 20,
          max_stock: 100,
          unit: 'kg',
          cost_per_unit: 8500,
          last_updated: '2024-12-19T08:00:00Z'
        },
        {
          id: 2,
          product: { id: 2, name: 'Leche Entera', category: 'Bebidas' },
          current_stock: 15,
          min_stock: 20,
          max_stock: 80,
          unit: 'litros',
          cost_per_unit: 1200,
          last_updated: '2024-12-19T07:30:00Z'
        },
        {
          id: 3,
          product: { id: 3, name: 'Croissant', category: 'Panadería' },
          current_stock: 5,
          min_stock: 10,
          max_stock: 50,
          unit: 'unidad',
          cost_per_unit: 800,
          last_updated: '2024-12-19T06:00:00Z'
        },
        {
          id: 4,
          product: { id: 4, name: 'Azúcar', category: 'Insumos' },
          current_stock: 25,
          min_stock: 15,
          max_stock: 60,
          unit: 'kg',
          cost_per_unit: 1500,
          last_updated: '2024-12-18T15:00:00Z'
        }
      ])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    if (stockFilter === 'low') {
      matchesFilter = item.current_stock <= item.min_stock
    } else if (stockFilter === 'ok') {
      matchesFilter = item.current_stock > item.min_stock && item.current_stock < item.max_stock
    } else if (stockFilter === 'full') {
      matchesFilter = item.current_stock >= item.max_stock
    }
    
    return matchesSearch && matchesFilter
  })

  const getStockStatus = (item) => {
    if (item.current_stock <= item.min_stock) {
      return { status: 'low', color: 'bg-red-100 text-red-800', text: 'Stock Bajo' }
    } else if (item.current_stock >= item.max_stock) {
      return { status: 'full', color: 'bg-blue-100 text-blue-800', text: 'Stock Lleno' }
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'Stock OK' }
    }
  }

  const getStockPercentage = (item) => {
    return Math.round((item.current_stock / item.max_stock) * 100)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleStockMovement = (product, type) => {
    setSelectedProduct({ ...product, movementType: type })
    setShowMovementModal(true)
  }

  const lowStockCount = inventory.filter(item => item.current_stock <= item.min_stock).length
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Stock</h1>
        <p className="text-gray-600">Controla el inventario de tu local</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lowStockCount}</p>
              <p className="text-sm text-red-600 mt-1">Requiere atención</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="low">Stock Bajo</option>
              <option value="ok">Stock Normal</option>
              <option value="full">Stock Lleno</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo Unitario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actualización
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                const stockPercentage = getStockPercentage(item)
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.product.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.current_stock} {item.unit}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              stockStatus.status === 'low' ? 'bg-red-500' :
                              stockStatus.status === 'full' ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Min: {item.min_stock} | Max: {item.max_stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.cost_per_unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.current_stock * item.cost_per_unit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.last_updated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleStockMovement(item, 'add')}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Agregar stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStockMovement(item, 'remove')}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Reducir stock"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Historial"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Stock Movement Modal */}
      {showMovementModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedProduct.movementType === 'add' ? 'Agregar Stock' : 'Reducir Stock'}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Producto: <span className="font-medium">{selectedProduct.product.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Stock actual: <span className="font-medium">{selectedProduct.current_stock} {selectedProduct.unit}</span>
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ingresa la cantidad"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                    {selectedProduct.movementType === 'add' ? (
                      <>
                        <option value="purchase">Compra</option>
                        <option value="adjustment">Ajuste de inventario</option>
                        <option value="return">Devolución</option>
                      </>
                    ) : (
                      <>
                        <option value="sale">Venta</option>
                        <option value="waste">Desperdicio</option>
                        <option value="adjustment">Ajuste de inventario</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Agregar notas sobre este movimiento..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMovementModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log('Processing stock movement...')
                  setShowMovementModal(false)
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white ${
                  selectedProduct.movementType === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-amber-700'
                }`}
              >
                {selectedProduct.movementType === 'add' ? 'Agregar Stock' : 'Reducir Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockManager
