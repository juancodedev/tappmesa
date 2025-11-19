import { useState, useEffect, useContext } from "react";
import { supabase } from "../../lib/supabase";
import { SuperAdminContext } from "../../context/SuperAdminContext";
import { useAuth } from "../../hooks/useAuth";
import SuperAdminNoTenantMessage from "./SuperAdminNoTenantMessage";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Clock,
  Coffee,
  AlertTriangle,
} from "lucide-react";

const Dashboard = () => {
  const { user, isSuperAdmin } = useAuth();
  const superAdminContext = useContext(SuperAdminContext);

  const [stats, setStats] = useState({
    dailySales: 0,
    activeOrders: 0,
    occupiedTables: 0,
    lowStockItems: 0,
    totalCustomers: 0,
    avgOrderTime: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get the tenant ID based on user type
  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId;
    }
    return user?.tenant_id || null;
  };

  useEffect(() => {
    loadDashboardData();
  }, [superAdminContext?.selectedTenantId, user?.tenant_id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const tenantId = getTenantId();

      // Show message if no tenant is available
      if (!tenantId) {
        console.log("No hay tenant disponible para cargar datos");
        setStats({
          dailySales: 0,
          activeOrders: 0,
          occupiedTables: 0,
          lowStockItems: 0,
          totalCustomers: 0,
          avgOrderTime: 0,
        });
        setRecentOrders([]);
        return;
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Load orders for today
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayISO)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate stats
      const dailySales = orders?.reduce((sum, o) => sum + parseFloat(o.total || 0), 0) || 0;
      const activeOrders = orders?.filter(o => ["pending", "preparing", "ready"].includes(o.status)).length || 0;

      // Load tables
      const { data: tables, error: tablesError } = await supabase
        .from("tables")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      if (tablesError) throw tablesError;

      const occupiedTables = tables?.filter(t => t.status === "occupied").length || 0;

      // Load stock items
      const { data: stockItems, error: stockError } = await supabase
        .from("stock_inventory")
        .select("*")
        .eq("tenant_id", tenantId)
        .lte("current_quantity", supabase.rpc("min_quantity"));

      if (stockError) console.error("Error loading stock:", stockError);

      const lowStockItems = stockItems?.length || 0;

      // Load customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id")
        .eq("tenant_id", tenantId);

      if (customersError) console.error("Error loading customers:", customersError);

      const totalCustomers = customers?.length || 0;

      setStats({
        dailySales,
        activeOrders,
        occupiedTables,
        lowStockItems,
        totalCustomers,
        avgOrderTime: 12, // TODO: Calculate real average
      });

      // Format recent orders
      const formattedOrders = orders?.slice(0, 4).map(order => ({
        id: order.id,
        number: order.order_number,
        table: order.table_number ? `Mesa ${order.table_number}` : "Para llevar",
        total: order.total,
        status: order.status,
        time: getTimeAgo(order.created_at),
      })) || [];

      setRecentOrders(formattedOrders);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Ahora";
    if (diffMins === 1) return "1 min";
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hora";
    return `${diffHours} horas`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "preparing":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "ready":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "preparing":
        return "Preparando";
      case "ready":
        return "Listo";
      case "delivered":
        return "Entregado";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-amber-200/50 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-amber-100/30 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show message if super admin hasn't selected a tenant
  if (isSuperAdmin && !getTenantId()) {
    return (
      <SuperAdminNoTenantMessage
        icon={Coffee}
        message="Utiliza el selector en la barra superior para ver el dashboard de un tenant específico"
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
        <p className="text-amber-700">
          {isSuperAdmin && superAdminContext?.selectedTenant
            ? `${superAdminContext.selectedTenant.name} - Resumen de actividad de hoy`
            : "Resumen de actividad de hoy"
          }
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">Ventas Hoy</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {formatCurrency(stats.dailySales)}
              </p>
              <p className="text-sm text-green-700 font-medium mt-1">+12% vs ayer</p>
            </div>
            <div className="p-3 bg-linear-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Órdenes Activas
              </p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {stats.activeOrders}
              </p>
              <p className="text-sm text-blue-700 font-medium mt-1">3 preparando</p>
            </div>
            <div className="p-3 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Mesas Ocupadas
              </p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {stats.occupiedTables}/12
              </p>
              <p className="text-sm text-orange-700 font-medium mt-1">50% ocupación</p>
            </div>
            <div className="p-3 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
              <Coffee className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-amber-200/50 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">Stock Bajo</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">
                {stats.lowStockItems}
              </p>
              <p className="text-sm text-red-700 font-medium mt-1">Requiere atención</p>
            </div>
            <div className="p-3 bg-linear-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200/50">
          <div className="p-6 border-b border-amber-200/50 bg-amber-50/50">
            <h3 className="text-lg font-bold text-amber-900">
              Órdenes Recientes
            </h3>
          </div>
          <div className="p-0">
            <div className="space-y-0">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border-b border-amber-100/50 last:border-b-0 hover:bg-amber-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-amber-900">
                        #{order.number}
                      </p>
                      <p className="text-sm text-amber-700">{order.table}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-900">
                        {formatCurrency(order.total)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {order.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200/50">
          <div className="p-6 border-b border-amber-200/50 bg-amber-50/50">
            <h3 className="text-lg font-bold text-amber-900">
              Estadísticas Rápidas
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Clientes Hoy</span>
              </div>
              <span className="font-bold text-amber-900">
                {stats.totalCustomers}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/50 transition-colors">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Tiempo Promedio</span>
              </div>
              <span className="font-bold text-amber-900">
                {stats.avgOrderTime} min
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/50 transition-colors">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-amber-800">
                  Crecimiento Semanal
                </span>
              </div>
              <span className="font-bold text-green-700">+18%</span>
            </div>

            {/* <div className="pt-4">
              <button className="w-full bg-linear-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-bold">
                Ver Reporte Completo
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
