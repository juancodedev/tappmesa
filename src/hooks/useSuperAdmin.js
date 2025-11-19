import { useContext } from 'react'
import { SuperAdminContext } from '../context/SuperAdminContext'

/**
 * Hook to access SuperAdminContext
 * Must be used within SuperAdminProvider
 */
export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext)

  if (!context) {
    throw new Error('useSuperAdmin must be used within SuperAdminProvider')
  }

  return context
}
