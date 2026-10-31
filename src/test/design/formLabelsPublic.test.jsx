import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { unassociatedLabels } from './labelAssociation'

// Form label association for the public forms (odd/tasks/form-labels.md, T1).
const chain = () => {
  const result = { data: [], error: null }
  const builder = {
    select: () => builder,
    eq: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  }
  return builder
}

vi.mock('../../lib/supabase', () => ({ supabase: { from: () => chain() } }))

import ReservationForm from '../../components/reservations/ReservationForm'

const files = ['components/reservations/ReservationForm.jsx', 'pages/auth/RegisterPage.jsx']

describe('public form labels', () => {
  it.each(files)('%s labels name their controls', (file) => {
    expect(unassociatedLabels(file)).toEqual([])
  })

  it('ReservationForm fields are reachable by their label text', async () => {
    render(<ReservationForm tenantId="t1" tenantName="Bistro" />)

    const name = screen.getByLabelText(/nombre completo/i)
    expect(name.tagName).toBe('INPUT')
    expect(name).toHaveAttribute('name', 'customer_name')

    const phone = screen.getByLabelText(/teléfono/i)
    expect(phone.tagName).toBe('INPUT')
    expect(phone).toHaveAttribute('name', 'customer_phone')

    const partySize = screen.getByLabelText(/número de personas/i)
    expect(partySize.tagName).toBe('SELECT')

    const requests = screen.getByLabelText(/solicitudes especiales/i)
    expect(requests.tagName).toBe('TEXTAREA')

    await screen.findByText('Reserva tu mesa')
  })
})
