import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Clock,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Tag,
  Upload
} from 'lucide-react'
import Modal from '../ui/Modal'
import { Button } from '../ui/Button'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'

const ProductsManager = () => {
  const confirm = useConfirm()
  const toast = useToast()
  const { tenant: currentTenant } = useTenant()
  const { isSuperAdmin } = useAuth()
  const superAdminContext = useContext(SuperAdminContext)

  // Get tenant ID based on user type
  const getTenantId = () => {
    if (isSuperAdmin && superAdminContext?.selectedTenantId) {
      return superAdminContext.selectedTenantId
    }
    return currentTenant?.id || null
  }

  const tenantId = getTenantId()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    preparation_time: 5,
    beverage_type: '',
    temperature_options: [],
    is_available: true,
    is_featured: false,
    display_order: 0
  })

  useEffect(() => {
    if (tenantId) {
      loadCategories()
      loadProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/cambiar tenant
  }, [tenantId, categoryFilter, superAdminContext?.selectedTenantId])

  const loadCategories = async () => {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async () => {
    if (!tenantId) return

    try {
      setLoading(true)

      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true })

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando productos:', error)
        setProducts([])
        return
      }

      setProducts(data || [])
      console.log('✅ Productos cargados:', data?.length || 0)
      
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
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

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price.toString(),
        category_id: product.category_id,
        image_url: product.image_url || '',
        preparation_time: product.preparation_time || 5,
        beverage_type: product.beverage_type || '',
        temperature_options: product.temperature_options || [],
        is_available: product.is_available,
        is_featured: product.is_featured,
        display_order: product.display_order
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
        image_url: '',
        preparation_time: 5,
        beverage_type: '',
        temperature_options: [],
        is_available: true,
        is_featured: false,
        display_order: products.length
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      preparation_time: 5,
      beverage_type: '',
      temperature_options: [],
      is_available: true,
      is_featured: false,
      display_order: 0
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.price || !formData.category_id) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      const productData = {
        tenant_id: tenantId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        image_url: formData.image_url || null,
        preparation_time: parseInt(formData.preparation_time),
        beverage_type: formData.beverage_type || null,
        temperature_options: formData.temperature_options,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        display_order: formData.display_order
      }

      if (editingProduct) {
        // Actualizar producto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        console.log('✅ Producto actualizado')
      } else {
        // Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert(productData)

        if (error) throw error
        console.log('✅ Producto creado')
      }

      closeModal()
      await loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Error al guardar el producto: ' + error.message)
    }
  }

  const handleDelete = async (productId) => {
    if (!await confirm('¿Estás seguro de que quieres eliminar este producto?', { confirmLabel: 'Eliminar', tone: 'danger' })) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
      
      console.log('✅ Producto eliminado')
      await loadProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar el producto: ' + error.message)
    }
  }

  const toggleAvailability = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id)

      if (error) throw error
      
      await loadProducts()
    } catch (error) {
      console.error('Error updating availability:', error)
    }
  }

  const toggleFeatured = async (product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_featured: !product.is_featured })
        .eq('id', product.id)

      if (error) throw error
      
      await loadProducts()
    } catch (error) {
      console.error('Error updating featured:', error)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen')
      return
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 2MB')
      return
    }

    try {
      setImageUploading(true)
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${tenantId}/${fileName}`

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image_url: publicUrl })
      console.log('✅ Imagen subida correctamente')
      
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error al subir la imagen: ' + error.message)
    } finally {
      setImageUploading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true
    return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Show message if no tenant is available
  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={Package}
          message="Utiliza el selector en la barra superior para ver los productos de un tenant específico"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600">
            Administra el menú de {currentTenant?.name || 'tu local'}
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Nuevo Producto</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay productos
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No se encontraron productos con ese criterio' : 'Crea tu primer producto para el menú'}
          </p>
          <Button onClick={() => openModal()}>
            Crear Producto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Imagen */}
              <div className="relative h-48">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {product.is_featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Destacado
                    </span>
                  )}
                  {!product.is_available && (
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      No disponible
                    </span>
                  )}
                </div>

                {/* Precio */}
                <div className="absolute bottom-2 right-2">
                  <span className="bg-white bg-opacity-90 text-gray-900 text-sm font-bold px-2 py-1 rounded">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleAvailability(product)}
                      aria-label={`${product.is_available ? 'Ocultar' : 'Mostrar'} ${product.name}`}
                      aria-pressed={!!product.is_available}
                      title={product.is_available ? 'Ocultar producto' : 'Mostrar producto'}
                      className={product.is_available ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}
                    >
                      {product.is_available ? <Eye className="w-4 h-4" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFeatured(product)}
                      aria-label={`${product.is_featured ? 'Quitar de destacados' : 'Destacar'} ${product.name}`}
                      aria-pressed={!!product.is_featured}
                      title={product.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                      className={product.is_featured ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-500 hover:text-gray-600'}
                    >
                      <Star className={`w-4 h-4 ${product.is_featured ? 'fill-current' : ''}`} aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="w-4 h-4 mr-2" />
                    {product.categories?.name || 'Sin categoría'}
                  </div>
                  
                  {product.preparation_time && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {product.preparation_time} min
                    </div>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Opciones de temperatura */}
                {product.temperature_options && product.temperature_options.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {product.temperature_options.map((temp, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {temp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    onClick={() => openModal(product)}
                    aria-label={`Editar ${product.name}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200"
                  >
                    <Edit className="w-4 h-4" aria-hidden="true" />
                    <span>Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    aria-label={`Eliminar ${product.name}`}
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <Modal
          isOpen
          onClose={closeModal}
          title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          size="lg"
          closeOnBackdrop={false}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    id="product-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ej: Latte Especial"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="product-slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    id="product-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="latte-especial"
                  />
                </div>

                <div>
                  <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    id="product-category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="product-price" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <input
                      id="product-price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                      min="0"
                      step="10"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="product-prep-time" className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo prep. (min)
                    </label>
                    <input
                      id="product-prep-time"
                      type="number"
                      value={formData.preparation_time}
                      onChange={(e) => setFormData({...formData, preparation_time: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1"
                      max="60"
                    />
                  </div>
                </div>
              </div>

              {/* Imagen y opciones */}
              <div className="space-y-4">
                <div>
                  <span id="product-image-caption" className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del producto
                  </span>
                  <div role="group" aria-labelledby="product-image-caption" className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {formData.image_url ? (
                      <div className="relative">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => setFormData({...formData, image_url: ''})}
                          aria-label="Quitar imagen"
                          className="absolute top-1 right-1 rounded-full"
                        >
                          <X className="w-3 h-3" aria-hidden="true" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={imageUploading}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center space-x-2"
                          >
                            <Upload className="w-4 h-4" />
                            <span>{imageUploading ? 'Subiendo...' : 'Subir imagen'}</span>
                          </label>
                          <input
                            type="url"
                            placeholder="O pegar URL de imagen"
                            value={formData.image_url}
                            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="product-beverage-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de bebida (opcional)
                  </label>
                  <select
                    id="product-beverage-type"
                    value={formData.beverage_type}
                    onChange={(e) => setFormData({...formData, beverage_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Sin especificar</option>
                    <option value="coffee">Café</option>
                    <option value="tea">Té</option>
                    <option value="juice">Jugo</option>
                    <option value="smoothie">Smoothie</option>
                    <option value="other">Otro</option>
                  </select>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                      Disponible
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_featured" className="ml-2 text-sm text-gray-700">
                      Destacado
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                id="product-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Describe el producto, ingredientes, etc."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4" aria-hidden="true" />
                <span>{editingProduct ? 'Actualizar' : 'Crear'}</span>
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default ProductsManager
