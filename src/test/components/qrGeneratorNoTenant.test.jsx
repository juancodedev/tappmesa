import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// /admin/qr must never hang on its loading skeleton when there is no tenant
// to load (super admin without a selected tenant).

const auth = vi.hoisted(() => ({ value: { isSuperAdmin: true, user: { tenant_id: null } } }))
const from = vi.hoisted(() => vi.fn())

vi.mock('../../lib/supabase', () => ({ supabase: { from } }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => auth.value }))

import QRGenerator from '../../components/admin/QRGenerator'

describe('QRGenerator without a tenant', () => {
  it('asks the super admin to pick a tenant instead of loading forever', () => {
    auth.value = { isSuperAdmin: true, user: { tenant_id: null } }
    render(<MemoryRouter><QRGenerator /></MemoryRouter>)

    expect(screen.getByText(/utiliza el selector en la barra superior/i)).toBeInTheDocument()
    expect(from).not.toHaveBeenCalled()
  })

  it('tells a staff user without a tenant that there is nothing to show', () => {
    auth.value = { isSuperAdmin: false, user: { tenant_id: null } }
    render(<MemoryRouter><QRGenerator /></MemoryRouter>)

    expect(screen.getByText(/tu usuario no tiene un local asignado/i)).toBeInTheDocument()
  })
})
