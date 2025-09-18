import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
};

// Función mejorada para extraer subdominio
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  console.log("🌐 Hostname:", hostname, "Parts:", parts);

  // Desarrollo local con .local
  if (hostname.endsWith(".local")) {
    // cafe-central.tappmesa.local → cafe-central
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== "tappmesa" && subdomain !== "www") {
        console.log("🏠 Local subdomain detected:", subdomain);
        return subdomain;
      }
    }
    return null;
  }

  // Desarrollo con localhost + query param (fallback)
  if (hostname === "localhost" || hostname.match(/^\d/)) {
    const urlParams = new URLSearchParams(window.location.search);
    const cafeParam = urlParams.get("cafe");
    if (cafeParam) {
      console.log("🔗 Query param detected:", cafeParam);
      return cafeParam;
    }
    return null;
  }

  // Producción: cafe-central.tappmesa.com
  if (hostname.includes("tappmesa.com")) {
    if (parts.length >= 3) {
      const subdomain = parts[0];
      if (subdomain !== "www" && subdomain !== "admin") {
        console.log("🌍 Production subdomain detected:", subdomain);
        return subdomain;
      }
    }
    return null;
  }

  // Otros dominios personalizados
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain !== "www") {
      console.log("🏢 Custom subdomain detected:", subdomain);
      return subdomain;
    }
  }

  return null;
};

// Función para determinar el tipo de aplicación
const getAppType = () => {
  const hostname = window.location.hostname;
  const subdomain = getSubdomain();

  // Admin específico
  if (
    hostname.startsWith("admin.") ||
    window.location.pathname.startsWith("/admin")
  ) {
    return "admin";
  }

  // Si hay subdominio, es una cafetería
  if (subdomain) {
    return "tenant";
  }

  // Landing page principal
  return "landing";
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appType, setAppType] = useState("landing");

  const loadTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const subdomain = getSubdomain();
      const currentAppType = getAppType();
      setAppType(currentAppType);

      console.log("🔍 Loading tenant for:", {
        subdomain,
        appType: currentAppType,
      });

      if (currentAppType !== "tenant" || !subdomain) {
        // No es una página de tenant
        setTenant(null);
        return;
      }

      // Buscar cafetería por subdominio
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("❌ Tenant not found:", error);
        throw new Error(`Cafetería "${subdomain}" no encontrada`);
      }

      setTenant(data);
      console.log("✅ Tenant loaded:", data.name);

      // Aplicar branding dinámico
      document.title = `${data.name} - Tappmesa`;
      document.documentElement.style.setProperty(
        "--primary-color",
        data.primary_color
      );
      document.documentElement.style.setProperty(
        "--secondary-color",
        data.secondary_color
      );
    } catch (error) {
      console.error("❌ Error loading tenant:", error);
      setError(error.message);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, []);

  const value = {
    tenant,
    loading,
    error,
    appType,
    loadTenant,
    setTenant,
    subdomain: getSubdomain(),
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
};

// Hook para detectar si estamos en un tenant
export const useIsTenant = () => {
  const { appType, tenant } = useTenant();
  return appType === "tenant" && !!tenant;
};

// Hook para obtener la URL base del tenant
export const useTenantUrl = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  // Generar URL base del tenant
  const hostname = window.location.hostname;

  if (hostname.endsWith(".local")) {
    return `http://${tenant.subdomain}.tappmesa.local:5173`;
  }

  if (hostname.includes("localhost")) {
    return `http://localhost:5173?cafe=${tenant.subdomain}`;
  }

  return `https://${tenant.subdomain}.tappmesa.com`;
};
