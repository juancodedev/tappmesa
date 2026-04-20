import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage'
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Package
} from 'lucide-react'

const CategoriesManager = () => {
  const { tenant: currentTenant } = useTenant()
  const { isSuperAdmin } = useAuth()
  const superAdminContext = useContext(SuperAdminContext)

  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId
    }
    return currentTenant?.id || null
  }

  const tenantId = getTenantId()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    display_order: 0,
    is_active: true
  })

  useEffect(() => {
    if (tenantId) {
      loadCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo recargar cuando cambie tenant
  }, [tenantId, superAdminContext?.selectedTenantId])

  const loadCategories = async () => {
    if (!tenantId) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products(count)
        `)
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })

      if (error) {
        console.error('Error cargando categorías:', error)
        setCategories([])
        return
      }

      setCategories(data || [])
      console.log('✅ Categorías cargadas:', data?.length || 0)
      
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        display_order: category.display_order,
        is_active: category.is_active
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        slug: '',
        display_order: categories.length,
        is_active: true
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      display_order: 0,
      is_active: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('El nombre es requerido')
      return
    }

    try {
      if (editingCategory) {
        // Actualizar categoría existente
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            slug: formData.slug,
            display_order: formData.display_order,
            is_active: formData.is_active
          })
          .eq('id', editingCategory.id)

        if (error) throw error
        console.log('✅ Categoría actualizada')
      } else {
        // Crear nueva categoría
        const { error } = await supabase
          .from('categories')
          .insert({
            tenant_id: tenantId,
            name: formData.name,
            slug: formData.slug,
            display_order: formData.display_order,
            is_active: formData.is_active
          })

        if (error) throw error
        console.log('✅ Categoría creada')
      }

      closeModal()
      await loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error al guardar la categoría: ' + error.message)
    }
  }

  const handleDelete = async (categoryId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Esto también eliminará todos los productos asociados.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error
      
      console.log('✅ Categoría eliminada')
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error al eliminar la categoría: ' + error.message)
    }
  }

  const updateDisplayOrder = async (categoryId, newOrder) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ display_order: newOrder })
        .eq('id', categoryId)

      if (error) throw error
      
      await loadCategories()
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const moveCategory = (index, direction) => {
    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return

    // Intercambiar posiciones
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]]
    
    // Actualizar display_order
    newCategories.forEach((cat, idx) => {
      updateDisplayOrder(cat.id, idx)
    })
  }

  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={Tag}
          message="Utiliza el selector en la barra superior para ver las categorías de un tenant específico"
        />
      )
    }

    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tenant disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se pudo cargar la información del local. Verifica que estés en el dominio correcto.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          <p className="text-gray-600">
            Organiza el menú de {currentTenant?.name || 'tu local'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Lista de categorías */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay categorías
            </h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera categoría para organizar los productos del menú
            </p>
            <button
              onClick={() => openModal()}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Crear Categoría
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {category.display_order + 1}
                        </span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => moveCategory(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveCategory(index, 'down')}
                            disabled={index === categories.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                          <Tag className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Package className="w-4 h-4 mr-2 text-gray-400" />
                        {category.products?.[0]?.count || 0} productos
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal(category)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Bebidas Calientes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="bebidas-calientes"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se genera automáticamente desde el nombre
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Categoría activa
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingCategory ? 'Actualizar' : 'Crear'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesManager
