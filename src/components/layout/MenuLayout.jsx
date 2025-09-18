import { useState } from "react";
import Header from "./Header";
import SearchBar from "../menu/SearchBar";
import CategoryTabs from "../menu/CategoryTabs";

const MenuLayout = ({ children }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm("");
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // TODO: Implementar filtro de búsqueda
    console.log("Searching for:", term);
  };

  const handleCategoryChange = (categorySlug) => {
    setActiveCategory(categorySlug);
    // TODO: Implementar filtro por categoría
    console.log("Category changed to:", categorySlug);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fijo */}
      <Header
        onMenuToggle={() => setShowMenu(!showMenu)}
        onSearchToggle={handleSearchToggle}
      />

      {/* Barra de búsqueda */}
      <SearchBar
        isVisible={showSearch}
        onSearch={handleSearch}
        onClose={() => setShowSearch(false)}
      />

      {/* Tabs de categorías - solo visible si no hay búsqueda activa */}
      {!showSearch && (
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Contenido principal */}
      <main className={`px-4 pb-20 ${showSearch ? "pt-32" : "pt-28"}`}>
        {children}
      </main>

      {/* Menu lateral (placeholder) */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg p-4">
            <button
              onClick={() => setShowMenu(false)}
              className="mb-4 text-gray-600 hover:text-gray-900"
            >
              ✕ Cerrar
            </button>
            <div className="space-y-4">
              <a href="#" className="block text-gray-700 hover:text-gray-900">
                Inicio
              </a>
              <a href="#" className="block text-gray-700 hover:text-gray-900">
                Carrito
              </a>
              <a href="#" className="block text-gray-700 hover:text-gray-900">
                Reservas
              </a>
              <a href="#" className="block text-gray-700 hover:text-gray-900">
                Contacto
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuLayout;
