import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useTenant } from '../../hooks/useTenant';
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
  Save,
  X,
  ArrowUpDown,
  Truck,
  Calendar,
  DollarSign,
  Eye,
  RefreshCw,
} from "lucide-react";

const CompleteStockManager = () => {
  const { tenant: currentTenant } = useTenant();
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Modales
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Estado seleccionado
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Formularios
  const [movementForm, setMovementForm] = useState({
    type: "in",
    quantity: "",
    reason: "",
    unitCost: "",
    notes: "",
  });

  const [editForm, setEditForm] = useState({
    currentStock: "",
    minStock: "",
    maxStock: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    location: "",
    expiryDate: "",
    notes: "",
  });

  useEffect(() => {
    if (currentTenant) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/cambiar tenant
  }, [currentTenant]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadInventory(), loadAlerts(), loadSuppliers()]);
    setLoading(false);
  };

  const loadInventory = async () => {
    if (!currentTenant) return;

    try {
      const { data, error } = await supabase
        .from("stock_inventory")
        .select(
          `
          *,
          products (
            id,
            name,
            price,
            categories (
              name
            )
          )
        `
        )
        .eq("tenant_id", currentTenant.id)
        .order("last_updated", { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  };

  const loadMovements = async (productId) => {
    if (!currentTenant) return;

    try {
      const { data, error } = await supabase
        .from("stock_movements")
        .select(
          `
          *,
          products (
            name
          )
        `
        )
        .eq("tenant_id", currentTenant.id)
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error("Error loading movements:", error);
    }
  };

  const loadAlerts = async () => {
    if (!currentTenant) return;

    try {
      const { data, error } = await supabase
        .from("stock_alerts")
        .select(
          `
          *,
          products (
            name
          )
        `
        )
        .eq("tenant_id", currentTenant.id)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const loadSuppliers = async () => {
    if (!currentTenant) return;

    try {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("tenant_id", currentTenant.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const handleMovement = async (e) => {
    e.preventDefault();

    if (!selectedItem || !movementForm.quantity) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      const quantity = parseFloat(movementForm.quantity);
      const unitCost = movementForm.unitCost
        ? parseFloat(movementForm.unitCost)
        : null;
      const totalCost = unitCost ? quantity * unitCost : null;

      const { error } = await supabase.from("stock_movements").insert({
        tenant_id: currentTenant.id,
        product_id: selectedItem.product_id,
        stock_inventory_id: selectedItem.id,
        movement_type: movementForm.type,
        quantity:
          movementForm.type === "adjustment" ? quantity : Math.abs(quantity),
        unit_cost: unitCost,
        total_cost: totalCost,
        reason: movementForm.reason,
        notes: movementForm.notes || null,
        created_by: "admin",
      });

      if (error) throw error;

      console.log("✅ Movimiento de stock registrado");
      setShowMovementModal(false);
      setMovementForm({
        type: "in",
        quantity: "",
        reason: "",
        unitCost: "",
        notes: "",
      });

      await loadInventory();
      await loadAlerts();
    } catch (error) {
      console.error("Error registering movement:", error);
      alert("Error al registrar el movimiento: " + error.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    if (!selectedItem) return;

    try {
      const { error } = await supabase
        .from("stock_inventory")
        .update({
          current_stock: parseFloat(editForm.currentStock),
          min_stock: parseFloat(editForm.minStock),
          max_stock: parseFloat(editForm.maxStock),
          unit: editForm.unit,
          cost_per_unit: parseFloat(editForm.costPerUnit),
          supplier: editForm.supplier || null,
          location: editForm.location || null,
          expiry_date: editForm.expiryDate || null,
          notes: editForm.notes || null,
          last_updated: new Date().toISOString(),
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      console.log("✅ Inventario actualizado");
      setShowEditModal(false);
      await loadInventory();
    } catch (error) {
      console.error("Error updating inventory:", error);
      alert("Error al actualizar el inventario: " + error.message);
    }
  };

  const openMovementModal = (item, type) => {
    setSelectedItem(item);
    setMovementForm({
      type,
      quantity: "",
      reason:
        type === "in" ? "purchase" : type === "out" ? "sale" : "adjustment",
      unitCost: item.cost_per_unit || "",
      notes: "",
    });
    setShowMovementModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditForm({
      currentStock: item.current_stock,
      minStock: item.min_stock,
      maxStock: item.max_stock,
      unit: item.unit,
      costPerUnit: item.cost_per_unit,
      supplier: item.supplier || "",
      location: item.location || "",
      expiryDate: item.expiry_date || "",
      notes: item.notes || "",
    });
    setShowEditModal(true);
  };

  const openHistoryModal = async (item) => {
    setSelectedProduct(item.products);
    await loadMovements(item.product_id);
    setShowHistoryModal(true);
  };

  const resolveAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from("stock_alerts")
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      await loadAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.products?.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (stockFilter === "low") {
      matchesFilter = item.current_stock <= item.min_stock;
    } else if (stockFilter === "out") {
      matchesFilter = item.current_stock <= 0;
    } else if (stockFilter === "ok") {
      matchesFilter =
        item.current_stock > item.min_stock &&
        item.current_stock < item.max_stock;
    } else if (stockFilter === "high") {
      matchesFilter = item.current_stock >= item.max_stock;
    }

    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (item) => {
    if (item.current_stock <= 0) {
      return {
        status: "out",
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Agotado",
        icon: AlertTriangle,
      };
    } else if (item.current_stock <= item.min_stock) {
      return {
        status: "low",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Stock Bajo",
        icon: TrendingDown,
      };
    } else if (item.current_stock >= item.max_stock) {
      return {
        status: "high",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Stock Alto",
        icon: TrendingUp,
      };
    } else {
      return {
        status: "ok",
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Stock OK",
        icon: Package,
      };
    }
  };

  const getStockPercentage = (item) => {
    return Math.min(
      Math.round((item.current_stock / item.max_stock) * 100),
      100
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calcular estadísticas
  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter((item) => item.current_stock <= item.min_stock)
      .length,
    outOfStock: inventory.filter((item) => item.current_stock <= 0).length,
    totalValue: inventory.reduce(
      (sum, item) => sum + item.current_stock * item.cost_per_unit,
      0
    ),
    alertsCount: alerts.length,
  };

  if (!currentTenant) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenant disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del local. Verifica que estés en el dominio correcto.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Stock</h1>
          <p className="text-gray-600">
            Controla el inventario de {currentTenant?.name || "tu local"}
          </p>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-red-900 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alertas de Stock ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-red-800">{alert.message}</span>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Resolver
                </button>
              </div>
            ))}
            {alerts.length > 3 && (
              <p className="text-red-700 text-xs">
                Y {alerts.length - 3} alertas más...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalItems}
              </p>
            </div>
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lowStock}
              </p>
            </div>
            <TrendingDown className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Agotados</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Valor Total</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Alertas</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.alertsCount}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
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
              <option value="out">Agotados</option>
              <option value="ok">Stock Normal</option>
              <option value="high">Stock Alto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de inventario */}
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
                  Proveedor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const stockPercentage = getStockPercentage(item);
                const StatusIcon = stockStatus.icon;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.products?.name || "Producto sin nombre"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.products?.categories?.name || "Sin categoría"}
                        </div>
                        {item.location && (
                          <div className="text-xs text-gray-400">
                            📍 {item.location}
                          </div>
                        )}
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
                              stockStatus.status === "out"
                                ? "bg-red-500"
                                : stockStatus.status === "low"
                                ? "bg-yellow-500"
                                : stockStatus.status === "high"
                                ? "bg-blue-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(stockPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Min: {item.min_stock} | Max: {item.max_stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
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
                      {item.supplier || "Sin proveedor"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openMovementModal(item, "in")}
                          className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                          title="Agregar stock"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openMovementModal(item, "out")}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Reducir stock"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openMovementModal(item, "adjustment")}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="Ajustar stock"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openHistoryModal(item)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Ver historial"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No se encontraron productos en el inventario
            </p>
          </div>
        )}
      </div>

      {/* Modal de movimiento de stock */}
      {showMovementModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {movementForm.type === "in"
                ? "Agregar Stock"
                : movementForm.type === "out"
                ? "Reducir Stock"
                : "Ajustar Stock"}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Producto:{" "}
                <span className="font-medium">
                  {selectedItem.products?.name}
                </span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Stock actual:{" "}
                <span className="font-medium">
                  {selectedItem.current_stock} {selectedItem.unit}
                </span>
              </p>
            </div>

            <form onSubmit={handleMovement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {movementForm.type === "adjustment"
                    ? "Nuevo stock total"
                    : "Cantidad"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={movementForm.type === "out" ? "0" : undefined}
                  max={
                    movementForm.type === "out"
                      ? selectedItem.current_stock
                      : undefined
                  }
                  value={movementForm.quantity}
                  onChange={(e) =>
                    setMovementForm({
                      ...movementForm,
                      quantity: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={`Cantidad en ${selectedItem.unit}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <select
                  value={movementForm.reason}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, reason: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  {movementForm.type === "in" ? (
                    <>
                      <option value="purchase">Compra</option>
                      <option value="return">Devolución</option>
                      <option value="transfer">Transferencia</option>
                      <option value="adjustment">Ajuste</option>
                    </>
                  ) : movementForm.type === "out" ? (
                    <>
                      <option value="sale">Venta</option>
                      <option value="waste">Desperdicio</option>
                      <option value="transfer">Transferencia</option>
                      <option value="sample">Muestra</option>
                      <option value="adjustment">Ajuste</option>
                    </>
                  ) : (
                    <option value="adjustment">Ajuste de inventario</option>
                  )}
                </select>
              </div>

              {(movementForm.type === "in" ||
                movementForm.type === "adjustment") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo unitario (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={movementForm.unitCost}
                    onChange={(e) =>
                      setMovementForm({
                        ...movementForm,
                        unitCost: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Costo por unidad"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  rows={3}
                  value={movementForm.notes}
                  onChange={(e) =>
                    setMovementForm({ ...movementForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white ${
                    movementForm.type === "in"
                      ? "bg-green-600 hover:bg-green-700"
                      : movementForm.type === "out"
                      ? "bg-red-600 hover:bg-primary-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {movementForm.type === "in"
                    ? "Agregar"
                    : movementForm.type === "out"
                    ? "Reducir"
                    : "Ajustar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Inventario - {selectedItem.products?.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleEdit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Actual
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.currentStock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, currentStock: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad
                </label>
                <select
                  value={editForm.unit}
                  onChange={(e) =>
                    setEditForm({ ...editForm, unit: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramos</option>
                  <option value="gramos">Gramos</option>
                  <option value="litros">Litros</option>
                  <option value="ml">Mililitros</option>
                  <option value="cajas">Cajas</option>
                  <option value="paquetes">Paquetes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.minStock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, minStock: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Máximo
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.maxStock}
                  onChange={(e) =>
                    setEditForm({ ...editForm, maxStock: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo Unitario
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.costPerUnit}
                  onChange={(e) =>
                    setEditForm({ ...editForm, costPerUnit: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  type="text"
                  value={editForm.supplier}
                  onChange={(e) =>
                    setEditForm({ ...editForm, supplier: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm({ ...editForm, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Estante A, Refrigerador 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={editForm.expiryDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, expiryDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Notas adicionales sobre el producto..."
                />
              </div>

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de historial */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de Movimientos - {selectedProduct.name}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            movement.movement_type === "in"
                              ? "bg-green-100 text-green-800"
                              : movement.movement_type === "out"
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {movement.movement_type === "in"
                            ? "Entrada"
                            : movement.movement_type === "out"
                            ? "Salida"
                            : "Ajuste"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.movement_type === "out" ? "-" : "+"}
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.created_by || "Sistema"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {movement.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {movements.length === 0 && (
              <div className="text-center py-8">
                <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No hay movimientos registrados</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="bg-primary text-gray-700 px-6 py-2 rounded-lg border border-gray-300 bg-primary hover:text-white hover:bg-primary-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompleteStockManager;
