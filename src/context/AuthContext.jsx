/* eslint-disable react-refresh/only-export-components -- archivo de contexto que exporta Provider y hook */
// src/context/AuthContext.jsx
import { createContext, useReducer, useEffect, useCallback } from "react";
import { authService } from "../lib/supabase";
import logger from "../utils/logger";

export const AuthContext = createContext();

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

  const checkTrialStatus = useCallback(async (tenantId) => {
    try {
      const trialData = await authService.getTrialStatus(tenantId);
      if (trialData) {
        dispatch({ type: authActions.SET_TRIAL_INFO, payload: trialData });
      }
    } catch (err) {
      logger.error("Error checking trial status:", err);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      // getCurrentSession adjunta el JWT (tappmesa-jwt) + setAccessToken
      // ANTES de resolver, así SET_USER siempre ve el JWT listo (C5).
      const session = await authService.getCurrentSession();

      if (session) {
        dispatch({ type: authActions.SET_USER, payload: {
          ...session.admin,
          tenant: session.tenant
        }});

        if (session.tenant) {
          await checkTrialStatus(session.tenant.id);
        }
      } else {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    } catch (err) {
      logger.error("Error checking auth status:", err);
      dispatch({ type: authActions.SET_LOADING, payload: false });
    }
  }, [checkTrialStatus]);

  // Verificar autenticación al cargar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')

    if (tokenFromUrl) {
      logger.dev('🔑 Token capturado de URL, guardando en localStorage')
      localStorage.setItem('tappmesa-session', tokenFromUrl)
      const cleanUrl = window.location.pathname
      window.history.replaceState({}, document.title, cleanUrl)
    }

    checkAuthStatus();
  }, [checkAuthStatus]);

  const register = async (registrationData) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.SET_ERROR, payload: null });

    try {
      const result = await authService.signUp(registrationData);

      if (result.success) {
        // C5: adjuntar JWT antes de SET_USER (ver login)
        try {
          await authService.refreshJwt();
        } catch (refreshErr) {
          logger.error("Error refreshing JWT after register:", refreshErr);
        }

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
    } catch {
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
        // C5: adjuntar JWT ANTES de SET_USER (TenantProvider depende de él).
        // signin no entrega JWT inline → refreshJwt() (best-effort).
        try {
          await authService.refreshJwt();
        } catch (refreshErr) {
          logger.error("Error refreshing JWT after login:", refreshErr);
        }

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
    } catch {
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
        'inventory:read', 'inventory:write',
        'qr:read', 'qr:write',
        'categories:read', 'categories:write', 'categories:delete',
        'reservations:read', 'reservations:write', 'reservations:delete',
        'users:read', 'users:write', 'users:delete'
      ];

      return tenantAdminPermissions.includes(`${resource}:${action}`);
    }

    // Permisos delegados para el personal (staff)
    if (state.user.role === 'staff') {
      const staffPermissions = [
        'orders:read', 'orders:write',
        'reservations:read', 'reservations:write',
        'customers:read',
        'tables:read'
      ];
      return staffPermissions.includes(`${resource}:${action}`);
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

// useAuth hook moved to src/hooks/useAuth.js for Fast Refresh compatibility
