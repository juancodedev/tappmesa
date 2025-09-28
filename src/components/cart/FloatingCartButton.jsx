import { useCart } from "../../context/CartContext";
import { useTenant } from "../../context/TenantContext";
import { ShoppingCart } from "lucide-react";
import { getOptimalTextClass } from "../../utils/helpers";

const FloatingCartButton = () => {
  const { tenant } = useTenant();
  const { openCart, getTotalItems, getTotal, formatPrice, isEmpty } = useCart();

  if (isEmpty) return null;

  const primaryColor = tenant?.primary_color || "#dc2626";
  const textClass = getOptimalTextClass(primaryColor);

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 safe-area-bottom"
      style={{ backgroundColor: tenant?.primary_color || "#dc2626" }}
    >
      <div className="flex items-center space-x-3 px-6 py-4">
        <div className="relative">
          <ShoppingCart className={`w-6 h-6 ${textClass}`} />
          <span
            className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            style={{ color: primaryColor }}
          >
            {getTotalItems()}
          </span>
        </div>

        <div className={textClass}>
          <div className="text-sm font-medium">Ver Carrito</div>
          <div className="text-xs opacity-90">{formatPrice(getTotal())}</div>
        </div>
      </div>
    </button>
  );
};

export default FloatingCartButton;
