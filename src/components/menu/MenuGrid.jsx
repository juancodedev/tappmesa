import { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import { supabase } from '../../lib/supabase'
import MenuCard from './MenuCard'
import { Coffee, Search } from 'lucide-react'

const MenuGrid = ({ activeCategory, searchTerm }) => {
  const { tenant } = useTenant()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tenant) return

    const loadProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        let query = supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name,
              slug
            )
          `)
          .eq('tenant_id', tenant.id)
          .order('display_order', { ascending: true })

        // Filtrar por categoría si no es "all"
        if (activeCategory && activeCategory !== 'all') {
          const { data: categoryData } = await supabase
            .from('categories')
            .select('id')
            .eq('tenant_id', tenant.id)
            .eq('slug', activeCategory)
            .single()

          if (categoryData) {
            query = query.eq('category_id', categoryData.id)
          }
        }

        const { data, error } = await query

        if (error) throw error

        setProducts(data || [])
      } catch (error) {
        console.error('Error loading products:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [tenant, activeCategory])

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.categories?.name.toLowerCase().includes(searchLower)
    )
  })

  const handleAddToCart = (product, quantity, temperature) => {
    // Ya no es necesario - MenuCard maneja esto directamente
    console.log('Add to cart:', {
      product: product.name,
      quantity,
      temperature,
      total: product.price * quantity
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-2">⚠️</div>
        <h3 className="text-gray-900 font-medium mb-1">Error cargando el menú</h3>
        <p className="text-gray-600 text-sm">{error}</p>
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        {searchTerm ? (
          <>
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium mb-1">No se encontraron resultados</h3>
            <p className="text-gray-600 text-sm">
              No hay productos que coincidan con "{searchTerm}"
            </p>
          </>
        ) : (
          <>
            <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 font-medium mb-1">No hay productos</h3>
            <p className="text-gray-600 text-sm">
              Esta categoría aún no tiene productos disponibles
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Contador de resultados */}
      {searchTerm && (
        <div className="text-sm text-gray-600 mb-4">
          {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para "{searchTerm}"
        </div>
      )}

      {/* Grid de productos */}
      <div className="grid gap-4">
        {filteredProducts.map((product) => (
          <MenuCard
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </div>
  )
}

export default MenuGrid
