import { Building2 } from 'lucide-react'

/**
 * Message component shown when super admin hasn't selected a tenant
 * Reusable across all super admin views
 */
const SuperAdminNoTenantMessage = ({ icon: Icon = Building2, title = "Selecciona un Tenant", message }) => {
  const defaultMessage = "Utiliza el selector en la barra superior para ver los datos de un tenant específico"

  return (
    <div className="p-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
        <Icon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          {title}
        </h2>
        <p className="text-blue-700">
          {message || defaultMessage}
        </p>
      </div>
    </div>
  )
}

export default SuperAdminNoTenantMessage
