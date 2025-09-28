// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from "react";
import { authService } from "../lib/supabase";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  registrationStep: 1,
  trialInfo: null,
};

const authActions = {
  SET_USER: "SET_USER",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  LOGOUT: "LOGOUT",
  SET_REGISTRATION_STEP: "SET_REGISTRATION_STEP",
  SET_TRIAL_INFO: "SET_TRIAL_INFO",
};

function authReducer(state, action) {
  switch (action.type) {
    case authActions.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };
    case authActions.SET_LOADING:
      return { ...state, loading: action.payload };
    case authActions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case authActions.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        trialInfo: null,
        loading: false,
      };
    case authActions.SET_REGISTRATION_STEP:
      return { ...state, registrationStep: action.payload };
    case authActions.SET_TRIAL_INFO:
      return { ...state, trialInfo: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const session = await authService.getCurrentSession();

      if (session) {
        dispatch({ type: authActions.SET_USER, payload: {
          ...session.admin,
          tenant: session.tenant
        }});

        // Verificar estado del trial si es necesario
        if (session.tenant) {
          await checkTrialStatus(session.tenant.id);
        }
      } else {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      dispatch({ type: authActions.SET_LOADING, payload: false });
    }
  };

  const checkTrialStatus = async (tenantId) => {
    try {
      const trialData = await authService.getTrialStatus(tenantId);
      if (trialData) {
        dispatch({ type: authActions.SET_TRIAL_INFO, payload: trialData });
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
    }
  };

  const register = async (registrationData) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.SET_ERROR, payload: null });

    try {
      const result = await authService.signUp(registrationData);

      if (result.success) {
        dispatch({ type: authActions.SET_USER, payload: {
          ...result.admin,
          tenant: result.tenant
        }});
        dispatch({ type: authActions.SET_TRIAL_INFO, payload: result.trialInfo });
        return { success: true, user: { ...result.admin, tenant: result.tenant } };
      } else {
        dispatch({ type: authActions.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Error al registrar. Intenta nuevamente.";
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.SET_ERROR, payload: null });

    try {
      const result = await authService.signIn(email, password);

      if (result.success) {
        dispatch({ type: authActions.SET_USER, payload: {
          ...result.admin,
          tenant: result.tenant
        }});

        if (result.tenant) {
          await checkTrialStatus(result.tenant.id);
        }

        return { success: true, user: { ...result.admin, tenant: result.tenant } };
      } else {
        dispatch({ type: authActions.SET_ERROR, payload: result.error });
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = "Error al iniciar sesión. Intenta nuevamente.";
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await authService.signOut();
    dispatch({ type: authActions.LOGOUT });
  };

  const setRegistrationStep = (step) => {
    dispatch({ type: authActions.SET_REGISTRATION_STEP, payload: step });
  };

  // Check if user is super admin
  const isSuperAdmin = state.user?.role === 'super_admin';

  // Permission checking function
  const hasPermission = (resource, action) => {
    if (!state.user) return false;

    // Super admins have all permissions
    if (isSuperAdmin) return true;

    // Tenant admins have full permissions within their tenant
    if (state.user.role === 'tenant_admin') {
      // Define tenant admin permissions
      const tenantAdminPermissions = [
        'tables:read', 'tables:write', 'tables:delete',
        'products:read', 'products:write', 'products:delete',
        'orders:read', 'orders:write', 'orders:delete',
        'analytics:read',
        'settings:read', 'settings:write',
        'customers:read', 'customers:write',
        'inventory:read', 'inventory:write'
      ];

      return tenantAdminPermissions.includes(`${resource}:${action}`);
    }

    // Default: no permissions for other roles
    return false;
  };

  const value = {
    ...state,
    register,
    login,
    logout,
    setRegistrationStep,
    checkTrialStatus,
    isSuperAdmin,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}
