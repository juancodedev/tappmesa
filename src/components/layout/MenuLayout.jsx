import { useState } from 'react'
import CustomerMenuHeader from './CustomerMenuHeader'
import SearchBar from '../menu/SearchBar'
import CategoryTabs from '../menu/CategoryTabs'
import MenuGrid from '../menu/MenuGrid'
import Cart from '../cart/Cart'
import FloatingCartButton from '../cart/FloatingCartButton'
import TableOrdersHistory from '../table/TableOrdersHistory'

const MenuLayout = ({ children }) => {
  const [showSearch, setShowSearch] = useState(false)
  const [showOrders, setShowOrders] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchToggle = () => {
    setShowSearch(!showSearch)
    if (showSearch) {
      setSearchTerm('')
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleCategoryChange = (categorySlug) => {
    setActiveCategory(categorySlug)
    // Limpiar búsqueda al cambiar categoría
    setSearchTerm('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del menú del cliente */}
      <CustomerMenuHeader onOrdersClick={() => setShowOrders(!showOrders)} />

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
      <main className={`px-4 pb-20 ${showSearch ? 'pt-32' : 'pt-28'}`}>
        {children ? children : (
          <MenuGrid
            activeCategory={activeCategory}
            searchTerm={searchTerm}
          />
        )}
      </main>

      {/* Modal de pedidos */}
      {showOrders && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowOrders(false)}>
          <div
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-gray-900">Mis Pedidos</h2>
              <button
                onClick={() => setShowOrders(false)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <TableOrdersHistory />
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante del carrito */}
      <FloatingCartButton />

      {/* Modal del carrito */}
      <Cart />
    </div>
  )
}

export default MenuLayout