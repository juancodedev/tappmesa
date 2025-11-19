import { useState, useEffect, useContext } from "react";
import { supabase } from "../../lib/supabase";
import { useTenant } from '../../hooks/useTenant';
import { useAuth } from '../../hooks/useAuth';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage';
import {
  Users,
  Star,
  Phone,
  Mail,
  ShoppingBag,
  Calendar,
  TrendingUp,
  Gift,
  Search,
  Filter,
  Eye,
  Edit,
} from "lucide-react";

const CustomersManager = () => {
  const { tenant: currentTenant } = useTenant();
  const { isSuperAdmin } = useAuth();
  const superAdminContext = useContext(SuperAdminContext);

  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId;
    }
    return currentTenant?.id || null;
  };

  const tenantId = getTenantId();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (tenantId) {
      loadCustomers();
    }
  }, [tenantId, customerFilter, superAdminContext?.selectedTenantId]);

  const loadCustomers = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);

      let query = supabase
        .from("customers")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("total_spent", { ascending: false });

      // Filtrar por tipo de cliente
      if (customerFilter === "vip") {
        query = query.eq("is_vip", true);
      } else if (customerFilter === "frequent") {
        query = query.gte("total_orders", 5);
      } else if (customerFilter === "new") {
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        query = query.gte("created_at", thirtyDaysAgo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error cargando clientes:", error);
        setCustomers([]);
        return;
      }

      setCustomers(data || []);
      console.log("✅ Clientes cargados:", data?.length || 0);
    } catch (error) {
      console.error("Error loading customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchLower)
    );
  });

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
    });
  };

  const getCustomerSegment = (customer) => {
    if (customer.is_vip) {
      return {
        text: "VIP",
        color: "bg-purple-100 text-purple-800",
        icon: Star,
      };
    } else if (customer.total_orders >= 5) {
      return {
        text: "Frecuente",
        color: "bg-green-100 text-green-800",
        icon: TrendingUp,
      };
    } else {
      return {
        text: "Regular",
        color: "bg-gray-100 text-gray-800",
        icon: Users,
      };
    }
  };

  const getCustomerStats = () => {
    const stats = {
      total: customers.length,
      vip: customers.filter((c) => c.is_vip).length,
      frequent: customers.filter((c) => c.total_orders >= 5).length,
      new: customers.filter((c) => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(c.created_at) >= thirtyDaysAgo;
      }).length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.total_spent || 0), 0),
      avgOrderValue:
        customers.length > 0
          ? customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) /
            customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)
          : 0,
    };
    return stats;
  };

  const stats = getCustomerStats();
  console.log(currentTenant);
  

  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={Users}
          message="Utiliza el selector en la barra superior para ver los clientes de un tenant específico"
        />
      );
    }

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Gestión de Clientes
        </h1>
        <p className="text-gray-600">
          Administra tu base de clientes de {currentTenant?.name || "tu local"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Clientes
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clientes VIP</p>
              <p className="text-2xl font-bold text-purple-600">{stats.vip}</p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? Math.round((stats.vip / stats.total) * 100)
                  : 0}
                % del total
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Ingresos Totales
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Ticket Promedio
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.avgOrderValue || 0)}
              </p>
            </div>
            <ShoppingBag className="w-8 h-8 text-orange-600" />
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
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos los clientes</option>
              <option value="vip">Solo VIP</option>
              <option value="frequent">Frecuentes (5+ pedidos)</option>
              <option value="new">Nuevos (últimos 30 días)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segmento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const segment = getCustomerSegment(customer);
                const SegmentIcon = segment.icon;

                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${segment.color}`}
                        >
                          <SegmentIcon className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name || "Cliente sin nombre"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Cliente desde {formatDate(customer.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${segment.color}`}
                      >
                        <SegmentIcon className="w-3 h-3 mr-1" />
                        {segment.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <ShoppingBag className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.total_orders || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(customer.total_spent || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.last_order_date ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {formatDate(customer.last_order_date)}
                        </div>
                      ) : (
                        "Sin pedidos"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Gift className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.loyalty_points || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
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

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay clientes
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No se encontraron clientes con ese criterio"
                : "Los clientes aparecerán automáticamente cuando hagan pedidos"}
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles del cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalles del Cliente
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Información Personal
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Nombre:</strong>{" "}
                      {selectedCustomer.name || "No especificado"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {selectedCustomer.phone}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      {selectedCustomer.email || "No especificado"}
                    </p>
                    <p>
                      <strong>Cliente desde:</strong>{" "}
                      {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Estadísticas
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Total de pedidos:</strong>{" "}
                      {selectedCustomer.total_orders || 0}
                    </p>
                    <p>
                      <strong>Total gastado:</strong>{" "}
                      {formatCurrency(selectedCustomer.total_spent || 0)}
                    </p>
                    <p>
                      <strong>Puntos de lealtad:</strong>{" "}
                      {selectedCustomer.loyalty_points || 0}
                    </p>
                    <p>
                      <strong>Último pedido:</strong>{" "}
                      {selectedCustomer.last_order_date
                        ? formatDate(selectedCustomer.last_order_date)
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Segmentación
                  </h4>
                  <div className="space-y-2">
                    {selectedCustomer.is_vip && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <Star className="w-4 h-4 mr-1" />
                        Cliente VIP
                      </span>
                    )}
                    {selectedCustomer.total_orders >= 5 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Cliente Frecuente
                      </span>
                    )}
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
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

export default CustomersManager;
