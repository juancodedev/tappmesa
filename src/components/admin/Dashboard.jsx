import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Simular datos por ahora - en producción conectaríamos con Supabase
      setStats({
        dailySales: 127500,
        activeOrders: 8,
        occupiedTables: 6,
        lowStockItems: 3,
        totalCustomers: 45,
        avgOrderTime: 12,
      });

      setRecentOrders([
        {
          id: 1,
          number: "241219-001",
          table: "Mesa 3",
          total: 12500,
          status: "preparing",
          time: "2 min",
        },
        {
          id: 2,
          number: "241219-002",
          table: "Mesa 7",
          total: 8900,
          status: "ready",
          time: "8 min",
        },
        {
          id: 3,
          number: "241219-003",
          table: "Mesa 1",
          total: 15600,
          status: "delivered",
          time: "15 min",
        },
        {
          id: 4,
          number: "241219-004",
          table: "Mesa 12",
          total: 22300,
          status: "preparing",
          time: "3 min",
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Dashboard</h1>
        <p className="text-amber-700">Resumen de actividad de hoy</p>
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

            <div className="pt-4">
              <button className="w-full bg-linear-to-r from-amber-600 to-orange-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all font-bold">
                Ver Reporte Completo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
