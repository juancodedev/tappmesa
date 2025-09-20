// src/context/AuthContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  registrationStep: 1,
  trialInfo: null
};

const authActions = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  SET_REGISTRATION_STEP: 'SET_REGISTRATION_STEP',
  SET_TRIAL_INFO: 'SET_TRIAL_INFO'
};

function authReducer(state, action) {
  switch (action.type) {
    case authActions.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null
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
        loading: false
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
      const token = localStorage.getItem('tappmesa-token');
      if (!token) {
        dispatch({ type: authActions.SET_LOADING, payload: false });
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({ type: authActions.SET_USER, payload: userData });
        
        // Verificar estado del trial
        if (userData.plan === 'trial') {
          await checkTrialStatus(userData.id);
        }
      } else {
        localStorage.removeItem('tappmesa-token');
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: authActions.SET_LOADING, payload: false });
    }
  };

  const checkTrialStatus = async (userId) => {
    try {
      const response = await fetch(`/api/trial/status/${userId}`);
      if (response.ok) {
        const trialData = await response.json();
        dispatch({ type: authActions.SET_TRIAL_INFO, payload: trialData });
      }
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  const register = async (registrationData) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.SET_ERROR, payload: null });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...registrationData,
          plan: 'trial',
          trialDuration: 60 // 2 meses en días
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tappmesa-token', data.token);
        dispatch({ type: authActions.SET_USER, payload: data.user });
        dispatch({ type: authActions.SET_TRIAL_INFO, payload: data.trialInfo });
        return { success: true, user: data.user };
      } else {
        dispatch({ type: authActions.SET_ERROR, payload: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Error al registrar. Intenta nuevamente.';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const login = async (email, password) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    dispatch({ type: authActions.SET_ERROR, payload: null });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('tappmesa-token', data.token);
        dispatch({ type: authActions.SET_USER, payload: data.user });
        
        if (data.user.plan === 'trial') {
          await checkTrialStatus(data.user.id);
        }
        
        return { success: true, user: data.user };
      } else {
        dispatch({ type: authActions.SET_ERROR, payload: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('tappmesa-token');
    dispatch({ type: authActions.LOGOUT });
  };

  const setRegistrationStep = (step) => {
    dispatch({ type: authActions.SET_REGISTRATION_STEP, payload: step });
  };

  const value = {
    ...state,
    register,
    login,
    logout,
    setRegistrationStep,
    checkTrialStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

