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
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder={placeholder}
          autoFocus
        />

        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        <button
          onClick={onClose}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          style={{ right: searchTerm ? "2rem" : "0.75rem" }}
        >
          <span className="text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
