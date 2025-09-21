// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Obtener sesión inicial
    getInitialSession();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const getInitialSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in getInitialSession:", error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (authUser) => {
    try {
      // Obtener perfil del usuario desde tu tabla de usuarios
      const { data: profile, error } = await supabase
        .from("users") // Ajusta el nombre de tu tabla
        .select(
          `
          *,
          restaurant:restaurants(*)
        `
        )
        .eq("id", authUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // 'PGRST116' es "not found"
        console.error("Error fetching user profile:", error);
        return;
      }

      const userData = {
        id: authUser.id,
        email: authUser.email,
        ...profile,
        // Determinar rol del usuario
        role:
          profile?.role || (profile?.restaurant ? "restaurant" : "customer"),
      };

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // metadata que se puede incluir
        },
      });

      if (error) throw error;

      // Si el registro es exitoso y tienes datos adicionales,
      // crear el perfil del usuario
      if (data.user && !error) {
        await createUserProfile(data.user, userData);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error in signUp:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error in signIn:", error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setIsAuthenticated(false);

      return { error: null };
    } catch (error) {
      console.error("Error in signOut:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (authUser, additionalData) => {
    try {
      const { error } = await supabase.from("users").insert({
        id: authUser.id,
        email: authUser.email,
        first_name: additionalData.firstName,
        last_name: additionalData.lastName,
        phone: additionalData.phone,
        role: additionalData.role || "restaurant",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Si es un restaurante, crear también el registro del restaurante
      if (additionalData.businessData) {
        await createRestaurantProfile(authUser.id, additionalData.businessData);
      }
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  };

  const createRestaurantProfile = async (userId, businessData) => {
    try {
      const { error } = await supabase.from("restaurants").insert({
        owner_id: userId,
        name: businessData.businessName,
        type: businessData.businessType,
        address: businessData.address,
        city: businessData.city,
        region: businessData.region,
        description: businessData.description,
        website: businessData.website,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error creating restaurant profile:", error);
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      // Actualizar el estado local
      setUser((prev) => ({ ...prev, ...updates }));

      return { error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error("Error resetting password:", error);
      return { error };
    }
  };

  const value = {
    // Estado
    user,
    loading,
    isAuthenticated,

    // Métodos de autenticación
    signUp,
    signIn,
    signOut,

    // Métodos de perfil
    updateProfile,
    resetPassword,

    // Helpers
    isAdmin: user?.role === "admin",
    isRestaurant: user?.role === "restaurant",
    isCustomer: user?.role === "customer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
