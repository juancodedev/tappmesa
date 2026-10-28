import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

const SearchBar = ({
  onSearch,
  isVisible,
  onClose,
  placeholder = "Busca tu menú aquí",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </div>

          <input
            type="search"
            aria-label="Buscar en el menú"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-base leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent [&::-webkit-search-cancel-button]:hidden"
            placeholder={placeholder}
            autoFocus
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="touch-target justify-center absolute inset-y-0 right-0 my-auto rounded-lg text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="touch-target px-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
