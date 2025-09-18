import { useCart } from "../../context/CartContext";
import { useTenant } from "../../context/TenantContext";
import { ShoppingCart } from "lucide-react";

const FloatingCartButton = () => {
  const { tenant } = useTenant();
  const { openCart, getTotalItems, getTotal, formatPrice, isEmpty } = useCart();

  if (isEmpty) return null;

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 safe-area-bottom"
      style={{ backgroundColor: tenant?.primary_color || "#dc2626" }}
    >
      <div className="flex items-center space-x-3 px-6 py-4">
        <div className="relative">
          <ShoppingCart className="w-6 h-6 text-white" />
          <span
            className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            style={{ color: tenant?.primary_color || "#dc2626" }}
          >
            {getTotalItems()}
          </span>
        </div>

        <div className="text-white">
          <div className="text-sm font-medium">Ver Carrito</div>
          <div className="text-xs opacity-90">{formatPrice(getTotal())}</div>
        </div>
      </div>
    </button>
  );
};

export default FloatingCartButton;
