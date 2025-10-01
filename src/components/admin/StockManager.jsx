import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
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
  History,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const StockManager = () => {
  const { tenant } = useTenant()
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [movementHistory, setMovementHistory] = useState([])
  const [movementForm, setMovementForm] = useState({
    quantity: '',
    reason: 'purchase',
    notes: ''
  })
  const [editForm, setEditForm] = useState({
    min_stock: '',
    max_stock: '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    location: '',
    expiry_date: '',
    notes: ''
  })

  useEffect(() => {
    if (tenant) {
      loadInventory()
    }
  }, [tenant])

  const loadInventory = async () => {
    if (!tenant) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('stock_inventory')
        .select(`
          *,
          product:products(id, name, category:categories(name))
        `)
        .eq('tenant_id', tenant.id)
        .order('last_updated', { ascending: false })

      if (error) throw error

      // Transform data to match component structure
      const transformedData = (data || []).map(item => ({
        ...item,
        current_stock: parseFloat(item.current_stock),
        min_stock: parseFloat(item.min_stock),
        max_stock: parseFloat(item.max_stock),
        cost_per_unit: parseFloat(item.cost_per_unit),
        product: {
          id: item.product?.id,
          name: item.product?.name || 'Producto sin nombre',
          category: item.product?.category?.name || 'Sin categoría'
        }
      }))

      setInventory(transformedData)
    } catch (error) {
      console.error('Error loading inventory:', error)
      alert('Error al cargar el inventario: ' + error.message)
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

  const loadMovementHistory = async (stockInventoryId) => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('stock_inventory_id', stockInventoryId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setMovementHistory(data || [])
    } catch (error) {
      console.error('Error loading movement history:', error)
      alert('Error al cargar el historial: ' + error.message)
    }
  }

  const handleShowHistory = async (item) => {
    setSelectedProduct(item)
    await loadMovementHistory(item.id)
    setShowHistoryModal(true)
  }

  const handleOpenEdit = (item) => {
    setSelectedProduct(item)
    setEditForm({
      min_stock: item.min_stock,
      max_stock: item.max_stock,
      unit: item.unit,
      cost_per_unit: item.cost_per_unit,
      supplier: item.supplier || '',
      location: item.location || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
      notes: item.notes || ''
    })
    setShowEditModal(true)
  }

  const handleSubmitEdit = async () => {
    if (!selectedProduct) return

    try {
      const { error } = await supabase
        .from('stock_inventory')
        .update({
          min_stock: parseFloat(editForm.min_stock),
          max_stock: parseFloat(editForm.max_stock),
          unit: editForm.unit,
          cost_per_unit: parseFloat(editForm.cost_per_unit),
          supplier: editForm.supplier || null,
          location: editForm.location || null,
          expiry_date: editForm.expiry_date || null,
          notes: editForm.notes || null,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedProduct.id)

      if (error) throw error

      setShowEditModal(false)
      await loadInventory()
    } catch (error) {
      console.error('Error updating inventory:', error)
      alert('Error al actualizar el inventario: ' + error.message)
    }
  }

  const handleStockMovement = (product, type) => {
    setSelectedProduct({ ...product, movementType: type })
    setMovementForm({ quantity: '', reason: type === 'add' ? 'purchase' : 'sale', notes: '' })
    setShowMovementModal(true)
  }

  const handleSubmitMovement = async () => {
    if (!selectedProduct || !movementForm.quantity) {
      alert('Por favor ingresa la cantidad')
      return
    }

    const quantity = parseFloat(movementForm.quantity)
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0')
      return
    }

    try {
      const movementType = selectedProduct.movementType === 'add' ? 'in' : 'out'
      const newStock = selectedProduct.movementType === 'add'
        ? selectedProduct.current_stock + quantity
        : selectedProduct.current_stock - quantity

      if (newStock < 0) {
        alert('No puedes reducir el stock a un valor negativo')
        return
      }

      // Insert movement record
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          tenant_id: tenant.id,
          product_id: selectedProduct.product_id,
          stock_inventory_id: selectedProduct.id,
          movement_type: movementType,
          quantity: quantity,
          unit_cost: selectedProduct.cost_per_unit,
          total_cost: quantity * selectedProduct.cost_per_unit,
          reason: movementForm.reason,
          notes: movementForm.notes || null
        })

      if (movementError) throw movementError

      // Update stock inventory
      const { error: updateError } = await supabase
        .from('stock_inventory')
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedProduct.id)

      if (updateError) throw updateError

      setShowMovementModal(false)
      setMovementForm({ quantity: '', reason: 'purchase', notes: '' })
      await loadInventory()
    } catch (error) {
      console.error('Error processing stock movement:', error)
      alert('Error al procesar el movimiento: ' + error.message)
    }
  }

  const lowStockCount = inventory.filter(item => item.current_stock <= item.min_stock).length
  const totalValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.cost_per_unit), 0)

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay información disponible
          </h3>
          <p className="text-gray-600">
            No se pudo cargar la información del local
          </p>
        </div>
      </div>
    )
  }

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
                          onClick={() => handleShowHistory(item)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Historial"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
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
                    step="0.01"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ingresa la cantidad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo
                  </label>
                  <select
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
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
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
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
                onClick={handleSubmitMovement}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white ${
                  selectedProduct.movementType === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {selectedProduct.movementType === 'add' ? 'Agregar Stock' : 'Reducir Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Historial de Movimientos</h2>
                <p className="text-sm text-gray-600">{selectedProduct.product?.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {movementHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movementHistory.map((movement) => {
                    const isIncoming = movement.movement_type === 'in'
                    const reasonLabels = {
                      purchase: 'Compra',
                      sale: 'Venta',
                      waste: 'Desperdicio',
                      adjustment: 'Ajuste',
                      return: 'Devolución'
                    }

                    return (
                      <div key={movement.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className={`p-2 rounded-lg ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                              {isIncoming ? (
                                <ArrowUp className="w-5 h-5 text-green-600" />
                              ) : (
                                <ArrowDown className="w-5 h-5 text-red-600" />
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`font-semibold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                                  {isIncoming ? '+' : '-'}{parseFloat(movement.quantity).toFixed(2)} {selectedProduct.unit}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                  {reasonLabels[movement.reason] || movement.reason}
                                </span>
                              </div>

                              {movement.notes && (
                                <p className="text-sm text-gray-600 mb-1">{movement.notes}</p>
                              )}

                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{formatDate(movement.created_at)}</span>
                                {movement.total_cost && (
                                  <span>Costo: {formatCurrency(parseFloat(movement.total_cost))}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Editar Inventario</h2>
                <p className="text-sm text-gray-600">{selectedProduct.product?.name}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Mínimo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.min_stock}
                      onChange={(e) => setEditForm({ ...editForm, min_stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Máximo *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.max_stock}
                      onChange={(e) => setEditForm({ ...editForm, max_stock: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="litros">Litros</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="paquete">Paquete</option>
                      <option value="caja">Caja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo por Unidad *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={editForm.cost_per_unit}
                      onChange={(e) => setEditForm({ ...editForm, cost_per_unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor
                    </label>
                    <input
                      type="text"
                      value={editForm.supplier}
                      onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ej: Bodega A, Estante 3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      value={editForm.expiry_date}
                      onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    rows="3"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Información adicional sobre el producto..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockManager