import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  ExternalLink,
  Coffee,
  Calendar,
  MapPin,
} from "lucide-react";

const TenantTester = () => {
  const [tenants, setTenants] = useState([]);
  const [tenantStats, setTenantStats] = useState({});
  const [loading, setLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (tenantsError) throw tenantsError;

      setTenants(tenantsData || []);

      // Cargar estadísticas para cada tenant
      const stats = {};
      for (const tenant of tenantsData || []) {
        stats[tenant.id] = await loadTenantStats(tenant.id);
      }
      setTenantStats(stats);
    } catch (error) {
      console.error("Error loading tenants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTenantStats = async (tenantId) => {
    try {
      // Productos
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_available", true);

      // Mesas
      const { count: tablesCount } = await supabase
        .from("restaurant_tables")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("is_available", true);

      // Pedidos hoy
      const today = new Date().toISOString().split("T")[0];
      const { count: ordersToday } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .gte("created_at", today + "T00:00:00.000Z")
        .lt("created_at", today + "T23:59:59.999Z");

      // Reservas activas
      const { count: activeReservations } = await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", "confirmed")
        .gte("reservation_date", today);

      // Categorías de productos
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("name")
        .eq("tenant_id", tenantId)
        .eq("is_active", true);

      const categories = categoriesData?.length || 0;

      return {
        products: productsCount || 0,
        tables: tablesCount || 0,
        ordersToday: ordersToday || 0,
        activeReservations: activeReservations || 0,
        categories: categories,
      };
    } catch (error) {
      console.error("Error loading tenant stats:", error);
      return {
        products: 0,
        tables: 0,
        ordersToday: 0,
        activeReservations: 0,
        categories: 0,
      };
    }
  };

  const generateTenantUrl = (slug, page = "") => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // En desarrollo local con .local
    if (hostname.endsWith('.local')) {
      const baseUrl = `${protocol}//${slug}.tappmesa.local${port ? ':' + port : ''}`;
      return page ? `${baseUrl}/${page}` : baseUrl;
    }

    // En desarrollo local con .localhost
    if (hostname.endsWith('.localhost')) {
      const baseUrl = `${protocol}//${slug}.localhost${port ? ':' + port : ''}`;
      return page ? `${baseUrl}/${page}` : baseUrl;
    }

    // En desarrollo con localhost - redirigir al subdominio correcto
    if (hostname === 'localhost' || hostname.match(/^\d/)) {
      const baseUrl = `${protocol}//${slug}.localhost${port ? ':' + port : ''}`;
      return page ? `${baseUrl}/${page}` : baseUrl;
    }

    // En producción con tappmesa.com
    if (hostname.includes('tappmesa.com')) {
      const baseUrl = `https://${slug}.tappmesa.com`;
      return page ? `${baseUrl}/${page}` : baseUrl;
    }

    // En producción con Vercel (tappmesa.vercel.app)
    if (hostname.includes('vercel.app')) {
      const baseUrl = `https://${slug}.tappmesa.vercel.app`;
      return page ? `${baseUrl}/${page}` : baseUrl;
    }

    // Otros dominios personalizados
    const baseUrl = `${protocol}//${slug}.${hostname}`;
    return page ? `${baseUrl}/${page}` : baseUrl;
  };

  const openTenantUrl = (slug, page = "") => {
    const url = generateTenantUrl(slug, page);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pruebas Multi-Tenant
        </h1>
        <p className="text-gray-600">
          Prueba el sistema con diferentes cafeterías para verificar el
          aislamiento de datos
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Cómo probar:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>
            • Haz clic en los botones para abrir cada tenant en una nueva
            pestaña
          </p>
          <p>
            • Verifica que cada cafetería muestre solo sus productos y datos
          </p>
          <p>• Prueba hacer pedidos y reservas en diferentes tenants</p>
          <p>• Confirma que los datos no se mezclen entre cafeterías</p>
        </div>
      </div>

      {/* Lista de tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tenants.map((tenant) => {
          const stats = tenantStats[tenant.id] || {};

          return (
            <div
              key={tenant.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-linear-to-r from-primary to-red-700 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{tenant.name}</h3>
                    <p className="text-red-100">@{tenant.slug}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Coffee className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.products}
                    </p>
                    <p className="text-xs text-gray-600">Productos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.tables}
                    </p>
                    <p className="text-xs text-gray-600">Mesas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.ordersToday}
                    </p>
                    <p className="text-xs text-gray-600">Pedidos hoy</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.activeReservations}
                    </p>
                    <p className="text-xs text-gray-600">Reservas activas</p>
                  </div>
                </div>

                {stats.categories > 0 && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {stats.categories} categorías
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4">
                <div className="space-y-2">
                  <button
                    onClick={() => openTenantUrl(tenant.slug)}
                    className="w-full flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Ver Menú</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openTenantUrl(tenant.slug, "reservas")}
                      className="flex items-center justify-center space-x-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Reservas</span>
                    </button>

                    <button
                      onClick={() => openTenantUrl(tenant.slug, "mesa-1")}
                      className="flex items-center justify-center space-x-1 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Mesa 1</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>URL: {generateTenantUrl(tenant.slug).replace(/^https?:\/\//, '')}</p>
                  <p>
                    Creado:{" "}
                    {new Date(tenant.created_at).toLocaleDateString("es-CL")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tenants.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenants configurados
          </h3>
          <p className="text-gray-600 mb-4">
            Ejecuta el SQL de configuración para crear tenants de prueba
          </p>
          <button
            onClick={loadTenants}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Recargar
          </button>
        </div>
      )}

      {/* Panel de URLs de prueba */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">
          URLs de prueba rápida:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="space-y-1">
              <p className="font-medium text-gray-700">{tenant.name}:</p>
              <div className="space-y-0.5 ml-4">
                <p
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => openTenantUrl(tenant.slug)}
                >
                  {generateTenantUrl(tenant.slug).replace(/^https?:\/\//, '')}
                </p>
                <p
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => openTenantUrl(tenant.slug, "reservas")}
                >
                  {generateTenantUrl(tenant.slug, "reservas").replace(/^https?:\/\//, '')}
                </p>
                <p
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => openTenantUrl(tenant.slug, "mesa-1")}
                >
                  {generateTenantUrl(tenant.slug, "mesa-1").replace(/^https?:\/\//, '')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TenantTester;
