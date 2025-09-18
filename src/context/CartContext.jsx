import { createContext, useContext, useState, useEffect } from "react";
import { useTenant } from "./TenantContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { tenant } = useTenant();
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    if (!tenant) return;

    const savedCart = localStorage.getItem(`cart_${tenant.id}`);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, [tenant]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    if (!tenant) return;

    localStorage.setItem(`cart_${tenant.id}`, JSON.stringify(items));
  }, [items, tenant]);

  // Agregar item al carrito
  const addItem = (product, quantity = 1, temperature = "hot", notes = "") => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.product.id === product.id && item.temperature === temperature
      );

      if (existingItemIndex >= 0) {
        // Actualizar cantidad si el item ya existe
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: quantity,
          notes: notes || updatedItems[existingItemIndex].notes,
        };
        return updatedItems.filter((item) => item.quantity > 0);
      } else if (quantity > 0) {
        // Agregar nuevo item
        return [
          ...prevItems,
          {
            id: `${product.id}_${temperature}_${Date.now()}`,
            product,
            quantity,
            temperature,
            notes,
            addedAt: new Date().toISOString(),
          },
        ];
      }
      return prevItems;
    });
  };

  // Remover item del carrito
  const removeItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  // Actualizar cantidad de un item
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Actualizar notas de un item
  const updateNotes = (itemId, notes) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, notes } : item))
    );
  };

  // Limpiar carrito
  const clearCart = () => {
    setItems([]);
  };

  // Calcular totales
  const getItemTotal = (item) => {
    return item.product.price * item.quantity;
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + getItemTotal(item), 0);
  };

  const getTax = () => {
    // IVA en Chile es 19%
    return getSubtotal() * 0.19;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Abrir/cerrar carrito
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(!isOpen);

  const value = {
    // Estado
    items,
    isOpen,

    // Acciones
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    openCart,
    closeCart,
    toggleCart,

    // Cálculos
    getItemTotal,
    getSubtotal,
    getTax,
    getTotal,
    getTotalItems,
    formatPrice,

    // Utilidades
    isEmpty: items.length === 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
