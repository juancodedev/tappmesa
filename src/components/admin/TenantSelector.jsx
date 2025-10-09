import { Building2, Globe } from 'lucide-react'

/**
 * Tenant Selector Component for SuperAdmin
 * Allows SuperAdmin to view data for all tenants or filter by specific tenant
 */
const TenantSelector = ({
  tenants = [],
  selectedTenantId,
  onTenantChange,
  className = ""
}) => {
  const selectedTenant = tenants.find(t => t.id === selectedTenantId)

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">Vista:</span>
      </div>

      <div className="flex items-center space-x-2">
        <select
          value={selectedTenantId || 'all'}
          onChange={(e) => onTenantChange(e.target.value === 'all' ? null : e.target.value)}
          className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm font-medium"
        >
          <option value="all">
            🌍 Todos los Tenants
          </option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name} (@{tenant.slug})
            </option>
          ))}
        </select>

        {selectedTenant && (
          <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>{selectedTenant.name}</span>
          </div>
        )}

        {!selectedTenantId && (
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Vista Global</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TenantSelector
