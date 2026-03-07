import { useState, useEffect, useContext } from 'react'
import { supabase } from '../../lib/supabase'
import { useTenant } from '../../hooks/useTenant'
import { useAuth } from '../../hooks/useAuth'
import { SuperAdminContext } from '../../context/SuperAdminContext'
import SuperAdminNoTenantMessage from './SuperAdminNoTenantMessage'
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  Eye,
  Coffee,
  Users,
  MapPin,
  MoreVertical,
  Save,
  X
} from 'lucide-react'

const TablesManager = () => {
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
  const [tables, setTables] = useState([])
  const [tableStatuses, setTableStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [showActionsMenu, setShowActionsMenu] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    capacity: 2,
    location: 'interior',
    status_id: ''
  })

  useEffect(() => {
    if (tenantId) {
      loadTables()
      loadTableStatuses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar/cambiar tenant
  }, [tenantId, superAdminContext?.selectedTenantId])

  const loadTables = async () => {
    if (!tenantId) {
      console.warn('⚠️ No se puede cargar mesas: tenantId es null')
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      console.log('🔍 Cargando mesas para tenant:', tenantId)

      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('number')

      if (error) {
        console.error('❌ Error al cargar mesas desde Supabase:', error)
        setTables([])
      } else {
        // Asegurar que todas las mesas tengan un status válido
        const tablesWithStatus = (data || []).map(table => ({
          ...table,
          status: table.status || 'available'
        }))
        setTables(tablesWithStatus)
        console.log('✅ Mesas cargadas:', tablesWithStatus.length)

        // VALIDACIÓN: Verificar que todas las mesas pertenecen al tenant correcto
        if (data && data.length > 0) {
          const wrongTenantTables = data.filter(t => t.tenant_id !== tenantId)
          if (wrongTenantTables.length > 0) {
            console.error('🚨 ALERTA DE SEGURIDAD: Se cargaron mesas de otros tenants:', wrongTenantTables)
            alert('Error de seguridad: Se detectaron mesas de otros locales. Contacta a soporte.')
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading tables:', error)
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const loadTableStatuses = async () => {
    if (!tenantId) return

    try {
      const { data, error } = await supabase
        .from('table_statuses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('order_index', { ascending: true })

      if (error) throw error

      setTableStatuses(data || [])

      // Set default status if creating new table
      if (data && data.length > 0 && !formData.status_id) {
        const availableStatus = data.find(s => s.name === 'Disponible')
        if (availableStatus) {
          setFormData(prev => ({ ...prev, status_id: availableStatus.id }))
        }
      }
    } catch (error) {
      console.error('Error loading table statuses:', error)
    }
  }

  // Función para generar código único (12 caracteres para mayor seguridad)
  const generateUniqueCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Detectar si un código es del formato antiguo
  const isOldCodeFormat = (code) => {
    if (!code) return false
    // Formato antiguo: tenant-slug-mesa-N (ej: coffee-co-mesa-1, caf-central-mesa-1)
    // También detecta códigos con caracteres especiales mal codificados
    return /^[a-z0-9-]+-mesa-\d+$/i.test(code) || code.includes('-mesa-')
  }

  // Regenerar código de una mesa específica
  const handleRegenerateCode = async (tableId) => {
    if (!confirm('¿Regenerar el código QR de esta mesa? El código antiguo dejará de funcionar.')) {
      return
    }

    try {
      const newCode = generateUniqueCode()

      // Try with all optional columns first
      let { error } = await supabase
        .from('tables')
        .update({
          unique_code: newCode,
          qr_code_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId)

      // If columns don't exist, try with just unique_code
      if (error && (error.message?.includes('qr_code_generated_at') || error.message?.includes('updated_at'))) {
        console.warn('⚠️ Columnas opcionales missing, usando update básico')
        const result = await supabase
          .from('tables')
          .update({
            unique_code: newCode
          })
          .eq('id', tableId)

        error = result.error
      }

      if (error) throw error

      console.log('✅ Código regenerado:', newCode)
      alert(`Código regenerado exitosamente: ${newCode}`)
      await loadTables()
    } catch (error) {
      console.error('Error regenerating code:', error)
      alert('Error al regenerar el código: ' + error.message)
    }
  }

  // Regenerar todos los códigos antiguos
  const handleRegenerateAllOldCodes = async () => {
    if (!tenantId) {
      alert('Error: No se ha cargado el tenant')
      return
    }

    console.log('🔄 Iniciando migración de códigos...')

    try {
      // Cargar TODAS las mesas del tenant desde la base de datos
      const { data: allTables, error: loadError } = await supabase
        .from('tables')
        .select('*')
        .eq('tenant_id', tenantId)

      if (loadError) {
        console.error('Error cargando mesas:', loadError)
        alert('Error al cargar mesas: ' + loadError.message)
        return
      }

      console.log('📊 Total de mesas en BD:', allTables?.length || 0)

      if (!allTables || allTables.length === 0) {
        alert('No se encontraron mesas para actualizar')
        return
      }

      // Debug: mostrar todos los códigos
      allTables.forEach(t => {
        const isOld = isOldCodeFormat(t.unique_code)
        console.log(`Mesa "${t.number}": ${t.unique_code} → ${isOld ? '⚠️ ANTIGUO' : '✅ NUEVO'}`)
      })

      const oldCodeTables = allTables.filter(t => isOldCodeFormat(t.unique_code))

      console.log('📋 Mesas con código antiguo encontradas:', oldCodeTables.length)

      if (oldCodeTables.length === 0) {
        alert('No hay códigos antiguos para actualizar')
        return
      }

      if (!confirm(
        `¿Actualizar ${oldCodeTables.length} códigos antiguos a formato nuevo?\n\n` +
        `ADVERTENCIA: Los códigos QR impresos antiguos dejarán de funcionar.`
      )) {
        return
      }

      let updated = 0
      let errors = []

      for (const table of oldCodeTables) {
        const newCode = generateUniqueCode()
        console.log(`🔄 Actualizando ${table.number}: ${table.unique_code} → ${newCode}`)

        // Try with all columns first (new schema)
        let { data, error } = await supabase
          .from('tables')
          .update({
            unique_code: newCode,
            qr_code_generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', table.id)
          .select()

        // If fails due to missing columns, try with fewer columns
        if (error && (error.message?.includes('qr_code_generated_at') || error.message?.includes('updated_at'))) {
          console.warn('⚠️ Columnas opcionales missing, usando update básico')
          const result = await supabase
            .from('tables')
            .update({
              unique_code: newCode
            })
            .eq('id', table.id)
            .select()

          data = result.data
          error = result.error
        }

        if (error) {
          console.error(`❌ Error en ${table.number}:`, error)
          errors.push(`${table.number}: ${error.message}`)
        } else if (data && data.length > 0) {
          updated++
          console.log(`✅ ${table.number}: ${table.unique_code} → ${newCode}`)
        } else {
          console.warn(`⚠️ No se actualizó ${table.number} (no data returned)`)
          errors.push(`${table.number}: No se encontró la mesa`)
        }
      }

      console.log(`📊 Resultado: ${updated} actualizadas, ${errors.length} errores`)

      if (errors.length > 0) {
        console.error('❌ Errores:', errors)
        alert(`${updated} códigos actualizados, ${errors.length} errores:\n${errors.join('\n')}`)
      } else {
        alert(`✅ ${updated} códigos actualizados correctamente. Recarga la página para ver los cambios.`)
      }

      await loadTables()
    } catch (error) {
      console.error('💥 Error crítico:', error)
      alert('Error al regenerar códigos: ' + error.message)
    }
  }

  const handleAddTable = () => {
    setSelectedTable(null)

    // Obtener el estado "Disponible" por defecto si existe
    const availableStatus = tableStatuses.find(s => s.name === 'Disponible')

    setFormData({
      number: `Mesa ${tables.length + 1}`,
      capacity: 2,
      location: 'interior',
      status_id: availableStatus?.id || tableStatuses[0]?.id || ''
    })
    setShowAddModal(true)
  }

  const handleEditTable = (table) => {
    setSelectedTable(table)
    setFormData({
      number: table.number,
      capacity: table.capacity,
      location: table.location,
      status_id: table.status_id || ''
    })
    setShowAddModal(true)
    setShowActionsMenu(null)
  }

  const handleSaveTable = async () => {
    if (!tenantId) {
      alert('Error: No se ha cargado el tenant. Por favor, recarga la página.')
      return
    }

    try {
      setSaving(true)

      // Validaciones
      if (!formData.number.trim()) {
        alert('El número de mesa es requerido')
        return
      }

      if (formData.capacity < 1 || formData.capacity > 20) {
        alert('La capacidad debe estar entre 1 y 20 personas')
        return
      }

      if (selectedTable) {
        // Editar mesa existente
        const updateData = {
          number: formData.number.trim(),
          capacity: parseInt(formData.capacity),
          location: formData.location
        }

        // Solo agregar status_id si está definido
        if (formData.status_id) {
          updateData.status_id = formData.status_id
        }

        const { error } = await supabase
          .from('tables')
          .update(updateData)
          .eq('id', selectedTable.id)

        if (error) throw error
        console.log('✅ Mesa actualizada')
      } else {
        // Verificar que no exista una mesa con el mismo número
        const { data: existingTable } = await supabase
          .from('tables')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('number', formData.number.trim())
          .single()

        if (existingTable) {
          alert('Ya existe una mesa con ese número')
          return
        }

        // Crear nueva mesa (sin código QR - se generará a petición)
        const insertData = {
          tenant_id: tenantId,
          number: formData.number.trim(),
          capacity: parseInt(formData.capacity),
          location: formData.location,
          is_active: true
        }

        // Agregar status_id si está definido
        if (formData.status_id) {
          insertData.status_id = formData.status_id
        }

        console.log('📝 Creando mesa con datos:', {
          tenant_id: insertData.tenant_id,
          number: insertData.number
        })

        const { data: createdTable, error } = await supabase
          .from('tables')
          .insert(insertData)
          .select()
          .single()

        if (error) throw error

        // VALIDACIÓN: Verificar que la mesa creada tiene el tenant_id correcto
        if (createdTable && createdTable.tenant_id !== tenantId) {
          console.error('🚨 ALERTA DE SEGURIDAD: Mesa creada con tenant_id incorrecto!', {
            expected: tenantId,
            actual: createdTable.tenant_id,
            table: createdTable
          })
          throw new Error('Error de seguridad: La mesa se creó con un tenant_id incorrecto')
        }

        console.log('✅ Mesa creada exitosamente')
      }

      // Recargar mesas
      await loadTables()
      setShowAddModal(false)
      
    } catch (error) {
      console.error('Error saving table:', error)
      alert('Error al guardar la mesa: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTable = async (tableId) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error
      
      console.log('✅ Mesa eliminada')
      await loadTables()
    } catch (error) {
      console.error('Error deleting table:', error)
      alert('Error al eliminar la mesa: ' + error.message)
    }
    setShowActionsMenu(null)
  }

  const handleGenerateQR = async (tableId) => {
    if (!confirm('¿Generar código QR para esta mesa?')) {
      return
    }

    try {
      const newCode = generateUniqueCode()

      const { error } = await supabase
        .from('tables')
        .update({
          unique_code: newCode,
          qr_code_generated_at: new Date().toISOString()
        })
        .eq('id', tableId)

      if (error) throw error

      alert('¡Código QR generado exitosamente!')
      await loadTables()
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('Error al generar el código QR: ' + error.message)
    }
  }

  const handleViewQR = (table) => {
    if (!table.unique_code) {
      if (confirm('Esta mesa no tiene código QR. ¿Deseas generarlo ahora?')) {
        handleGenerateQR(table.id)
      }
      setShowActionsMenu(null)
      return
    }

    // Abrir página de QR en nueva pestaña
    const url = `/admin/qr?table=${table.id}`
    window.open(url, '_blank')
    setShowActionsMenu(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-yellow-100 text-yellow-800'
      case 'reserved': return 'bg-blue-100 text-blue-800'
      case 'maintenance': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'occupied': return 'Ocupada'
      case 'reserved': return 'Reservada'
      case 'maintenance': return 'Mantenimiento'
      default: return status
    }
  }

  const getLocationText = (location) => {
    switch (location) {
      case 'interior': return 'Interior'
      case 'terraza': return 'Terraza'
      case 'barra': return 'Barra'
      default: return location
    }
  }

  if (!tenantId) {
    if (isSuperAdmin) {
      return (
        <SuperAdminNoTenantMessage
          icon={Coffee}
          message="Utiliza el selector en la barra superior para ver las mesas de un tenant específico"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const oldCodesCount = tables.filter(t => isOldCodeFormat(t.unique_code)).length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h1>
          <p className="text-gray-600">
            {isSuperAdmin && superAdminContext?.selectedTenant
              ? `Administra las mesas de ${superAdminContext.selectedTenant.name}`
              : `Administra las mesas de ${currentTenant?.name || 'tu local'}`
            }
          </p>

          {/* Indicador de tenant */}
          {tenantId && (
            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-900">
                Local: {isSuperAdmin && superAdminContext?.selectedTenant
                  ? superAdminContext.selectedTenant.name
                  : currentTenant?.name || 'Desconocido'}
              </span>
              <span className="text-xs text-blue-600">
                (ID: {tenantId.substring(0, 8)}...)
              </span>
            </div>
          )}

          {!tenantId && (
            <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-red-900">
                ⚠️ Local no identificado - No se pueden gestionar mesas
              </span>
            </div>
          )}

          {oldCodesCount > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-sm text-orange-600">
                ⚠️ {oldCodesCount} mesa{oldCodesCount !== 1 ? 's' : ''} con código antiguo
              </span>
              <button
                onClick={handleRegenerateAllOldCodes}
                className="text-sm text-primary hover:text-red-700 underline"
              >
                Actualizar todas
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleAddTable}
          className="flex items-center space-x-2 bg-primary border border-gray-300  text-gray-700 px-4 py-2 rounded-lg hover:text-white hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Mesa</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{tables.length}</p>
            <p className="text-sm text-gray-600">Total Mesas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.status === 'available').length}
            </p>
            <p className="text-sm text-gray-600">Disponibles</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {tables.filter(t => t.status === 'occupied').length}
            </p>
            <p className="text-sm text-gray-600">Ocupadas</p>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {tables.filter(t => t.status === 'reserved').length}
            </p>
            <p className="text-sm text-gray-600">Reservadas</p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{table.number}</h3>
                <div className="relative">
                  <button
                    onClick={() => setShowActionsMenu(showActionsMenu === table.id ? null : table.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {/* Actions Menu */}
                  {showActionsMenu === table.id && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => handleViewQR(table)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Ver QR</span>
                        </button>
                        <button
                          onClick={() => handleEditTable(table)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table.id)}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                  {getStatusText(table.status)}
                </span>
                {!table.is_active && (
                  <span className="text-xs text-gray-500">Inactiva</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{table.capacity} personas</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{getLocationText(table.location)}</span>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Código único:</p>
                <div className="flex items-center justify-between">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {table.unique_code}
                  </code>
                  {isOldCodeFormat(table.unique_code) && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                      Antiguo
                    </span>
                  )}
                </div>
                {isOldCodeFormat(table.unique_code) && (
                  <button
                    onClick={() => handleRegenerateCode(table.id)}
                    className="mt-1 text-xs text-primary hover:text-red-700 underline"
                  >
                    Actualizar a nuevo formato
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewQR(table)}
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR</span>
                </button>
                <button
                  onClick={() => handleEditTable(table)}
                  className="flex-1 flex items-center border border-gray-300 justify-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-primary rounded-lg  hover:text-white hover:bg-amber-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedTable ? 'Editar Mesa' : 'Agregar Nueva Mesa'}
            </h3>
            
            <div className="space-y-4 mb-6">
              {/* Número de Mesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Mesa *
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Mesa 1, Mesa A, VIP 1"
                />
              </div>
              
              {/* Capacidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (personas) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="interior">Interior</option>
                  <option value="terraza">Terraza</option>
                  <option value="barra">Barra</option>
                  <option value="privado">Salón Privado</option>
                  <option value="exterior">Exterior</option>
                </select>
              </div>

              {/* Estado */}
              {tableStatuses.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={formData.status_id}
                    onChange={(e) => setFormData({ ...formData, status_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {tableStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Información adicional */}
              {!selectedTable && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>📝 Nota:</strong> Podrás generar un código QR para esta mesa después de crearla usando el botón "Ver QR".
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
              <button
                onClick={handleSaveTable}
                disabled={saving || !formData.number.trim()}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{selectedTable ? 'Actualizar Mesa' : 'Crear Mesa'}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Validaciones */}
            <div className="mt-4 text-xs text-gray-500">
              <p>* Campos obligatorios</p>
              {selectedTable && (
                <p>💡 El código QR existente se mantendrá sin cambios</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showActionsMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowActionsMenu(null)}
        />
      )}
    </div>
  )
}

export default TablesManager