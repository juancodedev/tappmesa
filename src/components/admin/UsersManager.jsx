{/* Add/Edit Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {selectedUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
      </h3>
      
      <div className="space-y-4 mb-6">
        {/* Nombre completo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formErrors.full_name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Juan Pérez"
          />
          {formErrors.full_name && (
            <p className="text-red-500 text-xs mt-1">{formErrors.full_name}</p>
          )}
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formErrors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="juan@cafecentral.cl"
            disabled={selectedUser} // No permitir cambiar email en edición por simplicidad
          />
          {formErrors.email && (
            <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
          )}
          {selectedUser && (
            <p className="text-xs text-gray-500 mt-1">
              💡 El email no se puede modificar una vez creado el usuario
            </p>
          )}
        </div>
        
        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              formErrors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+56912345678"
          />
          {formErrors.phone && (
            <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
          )}
        </div>
        
        {/* Contraseña */}
        {!selectedUser && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  formErrors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
          </div>
        )}
        
        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="staff">Personal</option>
            <option value="tenant_admin">Administrador</option>
            <option value="customer">Cliente</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.role === 'tenant_admin' && '👑 Acceso completo al panel de administración'}
            {formData.role === 'staff' && '👥 Acceso limitado para operaciones básicas'}
            {formData.role === 'customer' && '🛒 Solo acceso como cliente'}
          </p>
        </div>

        {/* Estado activo */}
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-gray-900">Usuario Activo</span>
              <p className="text-sm text-gray-600">
                {formData.is_active 
                  ? 'El usuario puede acceder al sistema' 
                  : 'El usuario no puede iniciar sesión'
                }
              </p>
            </div>
          </label>
        </div>

        {/* Información adicional */}
        {selectedUser && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-sm text-gray-600">
              <strong>Creado:</strong> {formatDate(selectedUser.created_at)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Último acceso:</strong> {formatDate(selectedUser.last_login)}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => setShowAddModal(false)}
          disabled={saving}
          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
Plus, 
Search, 
Filter, 
Edit, 
Trash2, 
Mail, 
Phone, 
Shield, 
ShieldCheck,
Clock,
Save,
X,
Eye,
EyeOff
} from 'lucide-react'

const UsersManager = () => {
const [users, setUsers] = useState([])
const [loading, setLoading] = useState(true)
const [searchTerm, setSearchTerm] = useState('')
const [roleFilter, setRoleFilter] = useState('all')
const [showAddModal, setShowAddModal] = useState(false)
const [selectedUser, setSelectedUser] = useState(null)
const [saving, setSaving] = useState(false)
const [currentTenant, setCurrentTenant] = useState(null)
const [showPassword, setShowPassword] = useState(false)

// Form state
const [formData, setFormData] = useState({
full_name: '',
email: '',
phone: '',
role: 'staff',
password: '',
is_active: true
})

const [formErrors, setFormErrors] = useState({})

useEffect(() => {
loadTenant()
}, [])

useEffect(() => {
if (currentTenant) {
loadUsers()
}
}, [currentTenant])

const loadTenant = async () => {
try {
const { data, error } = await supabase
  .from('tenants')
  .select('*')
  .eq('slug', 'cafe-central')
  .single()

if (error) {
  console.warn('No se pudo cargar tenant desde Supabase:', error)
  setCurrentTenant({ 
    id: 'mock-tenant-id', 
    name: 'Café Central (Demo)' 
  })
} else {
  setCurrentTenant(data)
  console.log('✅ Tenant cargado:', data.name)
}
} catch (error) {
console.error('Error loading tenant:', error)
setCurrentTenant({ 
  id: 'mock-tenant-id', 
  name: 'Café Central (Demo)' 
})
}
}

const loadUsers = async () => {
try {
setLoading(true)

const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('tenant_id', currentTenant.id)
  .order('created_at', { ascending: false })

if (error) {
  console.warn('No se pudo cargar usuarios desde Supabase:', error)
  // Datos de ejemplo si falla
  setUsers([
    {
      id: 1,
      full_name: 'Juan Pérez',
      email: 'juan@cafecentral.cl',
      phone: '+56912345678',
      role: 'tenant_admin',
      is_active: true,
      last_login: '2024-12-19T10:30:00Z',
      created_at: '2024-01-15T08:00:00Z'
    },
    {
      id: 2,
      full_name: 'María González',
      email: 'maria@cafecentral.cl',
      phone: '+56987654321',
      role: 'staff',
      is_active: true,
      last_login: '2024-12-19T09:15:00Z',
      created_at: '2024-02-20T10:00:00Z'
    }
  ])
} else {
  setUsers(data || [])
  console.log('✅ Usuarios cargados:', data?.length || 0)
}
} catch (error) {
console.error('Error loading users:', error)
} finally {
setLoading(false)
}
}

const validateForm = () => {
const errors = {}

if (!formData.full_name.trim()) {
errors.full_name = 'El nombre completo es requerido'
}

if (!formData.email.trim()) {
errors.email = 'El email es requerido'
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
errors.email = 'El email no tiene un formato válido'
}

if (!formData.phone.trim()) {
errors.phone = 'El teléfono es requerido'
} else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
errors.phone = 'El teléfono no tiene un formato válido'
}

if (!selectedUser && (!formData.password || formData.password.length < 6)) {
errors.password = 'La contraseña debe tener al menos 6 caracteres'
}

setFormErrors(errors)
return Object.keys(errors).length === 0
}

const handleAddUser = () => {
setSelectedUser(null)
setFormData({
full_name: '',
email: '',
phone: '',
role: 'staff',
password: '',
is_active: true
})
setFormErrors({})
setShowAddModal(true)
}

const handleEditUser = (user) => {
setSelectedUser(user)
setFormData({
full_name: user.full_name || '',
email: user.email || '',
phone: user.phone || '',
role: user.role || 'staff',
password: '', // No mostrar contraseña actual
is_active: user.is_active
})
setFormErrors({})
setShowAddModal(true)
}

const handleSaveUser = async () => {
if (!validateForm()) {
return
}

try {
setSaving(true)

if (selectedUser) {
  // Editar usuario existente
  const updateData = {
    full_name: formData.full_name.trim(),
    phone: formData.phone.trim(),
    role: formData.role,
    is_active: formData.is_active,
    updated_at: new Date().toISOString()
  }

  // Solo actualizar email si cambió (requiere manejo especial en Supabase Auth)
  if (formData.email !== selectedUser.email) {
    updateData.email = formData.email.trim()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', selectedUser.id)

  if (error) throw error
  console.log('✅ Usuario actualizado')
} else {
  // Crear nuevo usuario
  // Verificar que no exista un usuario con el mismo email
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', formData.email.trim())
    .single()

  if (existingUser) {
    setFormErrors({ email: 'Ya existe un usuario con este email' })
    return
  }

  // En un sistema real, aquí crearíamos el usuario en Supabase Auth primero
  // Por ahora, simulamos creando directamente en profiles
  const { error } = await supabase
    .from('profiles')
    .insert({
      tenant_id: currentTenant.id,
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      is_active: formData.is_active,
      created_at: new Date().toISOString()
    })

  if (error) throw error
  console.log('✅ Usuario creado')
}

await loadUsers()
setShowAddModal(false)

} catch (error) {
console.error('Error saving user:', error)
alert('Error al guardar el usuario: ' + error.message)
} finally {
setSaving(false)
}
}

const handleDeleteUser = async (userId) => {
if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
return
}

try {
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', userId)

if (error) throw error

console.log('✅ Usuario eliminado')
await loadUsers()
} catch (error) {
console.error('Error deleting user:', error)
alert('Error al eliminar el usuario: ' + error.message)
}
}

const toggleUserStatus = async (userId, currentStatus) => {
try {
const { error } = await supabase
  .from('profiles')
  .update({ 
    is_active: !currentStatus,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)

if (error) throw error

console.log('✅ Estado de usuario actualizado')
await loadUsers()
} catch (error) {
console.error('Error toggling user status:', error)
alert('Error al cambiar el estado del usuario: ' + error.message)
}
}

const filteredUsers = users.filter(user => {
const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   user.email.toLowerCase().includes(searchTerm.toLowerCase())
const matchesRole = roleFilter === 'all' || user.role === roleFilter
return matchesSearch && matchesRole
})

const getRoleColor = (role) => {
switch (role) {
case 'tenant_admin': return 'bg-purple-100 text-purple-800'
case 'staff': return 'bg-blue-100 text-blue-800'
case 'customer': return 'bg-green-100 text-green-800'
default: return 'bg-gray-100 text-gray-800'
}
}

const getRoleText = (role) => {
switch (role) {
case 'tenant_admin': return 'Administrador'
case 'staff': return 'Personal'
case 'customer': return 'Cliente'
default: return role
}
}

const getRoleIcon = (role) => {
switch (role) {
case 'tenant_admin': return ShieldCheck
case 'staff': return Shield
default: return Shield
}
}

const formatDate = (dateString) => {
return new Date(dateString).toLocaleDateString('es-CL', {
day: '2-digit',
month: '2-digit',
year: 'numeric',
hour: '2-digit',
minute: '2-digit'
})
}

const handleAddUser = () => {
setSelectedUser(null)
setShowAddModal(true)
}

const handleDeleteUser = async (userId) => {
if (confirm('¿Estás seguro de eliminar este usuario?')) {
try {
  // Aquí iría la lógica de eliminación
  console.log('Deleting user:', userId)
  await loadUsers()
} catch (error) {
  console.error('Error deleting user:', error)
}
}
}

const toggleUserStatus = async (userId, currentStatus) => {
try {
// Aquí iría la lógica para activar/desactivar usuario
console.log('Toggling user status:', userId, !currentStatus)
await loadUsers()
} catch (error) {
console.error('Error toggling user status:', error)
}
}

if (loading) {
return (
<div className="p-6">
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="h-12 bg-gray-200 rounded"></div>
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
    <p className="text-gray-600">Administra los usuarios de tu local</p>
  </div>
  <button
    onClick={handleAddUser}
    className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
  >
    <Plus className="w-4 h-4" />
    <span>Agregar Usuario</span>
  </button>
</div>

{/* Filters */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
    {/* Search */}
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder="Buscar por nombre o email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
    </div>

    {/* Role Filter */}
    <div className="flex items-center space-x-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        <option value="all">Todos los roles</option>
        <option value="tenant_admin">Administradores</option>
        <option value="staff">Personal</option>
        <option value="customer">Clientes</option>
      </select>
    </div>
  </div>
</div>

{/* Users Table */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Usuario
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contacto
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Rol
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Estado
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Último acceso
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {filteredUsers.map((user) => {
          const RoleIcon = getRoleIcon(user.role)
          return (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {user.id}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="w-4 h-4 text-gray-400 mr-2" />
                    {user.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    {user.phone}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <RoleIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => toggleUserStatus(user.id, user.is_active)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                    user.is_active
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {user.is_active ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  {formatDate(user.last_login)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors"
                    title="Editar usuario"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>

  {filteredUsers.length === 0 && (
    <div className="text-center py-12">
      <p className="text-gray-500">No se encontraron usuarios</p>
    </div>
  )}
</div>

{/* Add/Edit Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {selectedUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
      </h3>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre completo
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Juan Pérez"
            defaultValue={selectedUser?.full_name}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="juan@cafecentral.cl"
            defaultValue={selectedUser?.email}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="+56912345678"
            defaultValue={selectedUser?.phone}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            defaultValue={selectedUser?.role || 'staff'}
          >
            <option value="tenant_admin">Administrador</option>
            <option value="staff">Personal</option>
            <option value="customer">Cliente</option>
          </select>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={() => setShowAddModal(false)}
          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            console.log('Saving user...')
            setShowAddModal(false)
          }}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          {selectedUser ? 'Actualizar' : 'Crear Usuario'}
        </button>
      </div>
    </div>
  </div>
)}
</div>
)
}

export default UsersManager