import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../components/layout/CustomerMenuHeader', () => ({
  default: ({ onOrdersClick }) => <button onClick={onOrdersClick}>Mis pedidos</button>,
}))
vi.mock('../../components/menu/SearchBar', () => ({ default: () => null }))
vi.mock('../../components/menu/CategoryTabs', () => ({ default: () => null }))
vi.mock('../../components/menu/MenuGrid', () => ({ default: () => null }))
vi.mock('../../components/cart/Cart', () => ({ default: () => null }))
vi.mock('../../components/cart/FloatingCartButton', () => ({ default: () => null }))
vi.mock('../../components/table/TableOrdersHistory', () => ({ default: () => <p>historial</p> }))

import MenuLayout from '../../components/layout/MenuLayout'

const openPanel = async () => {
  const user = userEvent.setup()
  render(<MenuLayout />)
  await user.click(screen.getByRole('button', { name: 'Mis pedidos' }))
  return user
}

describe('MenuLayout orders panel', () => {
  it('opens as a labelled modal dialog', async () => {
    await openPanel()
    expect(screen.getByRole('dialog', { name: /mis pedidos/i })).toHaveAttribute('aria-modal', 'true')
  })

  it('closes with the Escape key', async () => {
    await openPanel()
    expect(screen.getByText('historial')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('historial')).not.toBeInTheDocument()
  })

  it('closes from an accessible 44px close button', async () => {
    const user = await openPanel()
    const close = screen.getByRole('button', { name: /cerrar mis pedidos/i })
    expect(close).toHaveClass('touch-target')
    await user.click(close)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
