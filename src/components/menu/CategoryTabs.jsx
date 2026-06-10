import { useState, useEffect } from "react";
import { useTenant } from '../../hooks/useTenant';
import { supabase } from "../../lib/supabase";
import {
  Grid3X3,
  Coffee,
  Leaf,
  Cake,
  Sandwich,
  IceCream,
  Milk,
  Apple,
} from "lucide-react";

// Mapeo de iconos
const iconMap = {
  "grid-3x3": Grid3X3,
  coffee: Coffee,
  leaf: Leaf,
  cake: Cake,
  sandwich: Sandwich,
  "ice-cream": IceCream,
  milk: Milk,
  apple: Apple,
};

const CategoryTabs = ({ activeCategory, onCategoryChange }) => {
  const { tenant } = useTenant();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;

    const loadCategories = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .eq("tenant_id", tenant.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;

        setCategories(data || []);

        // Si no hay categoría activa, seleccionar la primera
        if (data && data.length > 0 && !activeCategory) {
          onCategoryChange(data[0].slug);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [tenant, activeCategory, onCategoryChange]);

  if (!tenant || loading) {
    return (
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-3 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 animate-pulse">
              <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-16 z-20 bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex space-x-3 overflow-x-auto scrollbar-none">
          {categories.map((category) => {
            const isActive = activeCategory === category.slug;
            const IconComponent = iconMap[category.icon] || Grid3X3;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.slug)}
                className={`shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap touch-target ${
                  isActive
                    ? "text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: tenant.primary_color,
                        boxShadow: `0 4px 8px ${tenant.primary_color}25`,
                      }
                    : {}
                }
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Indicador de scroll horizontal */}

    </div>
  );
};

export default CategoryTabs;
