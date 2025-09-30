import { useContext } from 'react'
import { TenantContext } from '../context/TenantContext'

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider')
  }
  return context
}