import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Customer table flow (QR menu → cart → order): accessibility and mobile UX.
// jsdom cannot measure rendered size, so touch targets are asserted through
// the `touch-target` utility (min 44x44px, src/index.css) and input font size
// through `text-base` (16px, avoids iOS Safari zoom on focus).

let tenantValue
let cartValue

vi.mock('../../hooks/useTenant', () => ({ useTenant: () => tenantValue }))
vi.mock('../../hooks/useCart', () => ({ useCart: () => cartValue }))
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '../../lib/supabase'
import Cart from '../../components/cart/Cart'
import CartItem from '../../features/cart/components/CartItem'
import MenuCard from '../../components/menu/MenuCard'
import SearchBar from '../../components/menu/SearchBar'
import FloatingCartButton from '../../components/cart/FloatingCartButton'

const product = {
  id: 'p1',
  name: 'Latte',
  description: 'Café con leche',
  price: 3500,
  image_url: 'https://example.com/latte.jpg',
  is_available: true,
  temperature_options: ['hot', 'iced'],
  beverage_type: 'coffee',
}

const cartItem = { id: 'i1', product, quantity: 2, temperature: 'hot', notes: '' }

const buildCart = (overrides = {}) => ({
  items: [cartItem],
  isOpen: true,
  closeCart: vi.fn(),
  openCart: vi.fn(),
  clearCart: vi.fn(),
  addItem: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  updateNotes: vi.fn(),
  getItemTotal: () => 7000,
  getSubtotal: () => 7000,
  getTax: () => 1330,
  getTotal: () => 8330,
  getTotalItems: () => 2,
  formatPrice: (n) => `$${n}`,
  isEmpty: false,
  placeOrder: vi.fn(),
  placingOrder: false,
  ...overrides,
})

beforeEach(() => {
  tenantValue = { tenant: { id: 't1', primary_color: '#8b5e3c' }, table: { number: '4' } }
  cartValue = buildCart()
})

describe('Cart dialog', () => {
  it('is exposed as a labelled modal dialog', () => {
    render(<Cart />)
    const dialog = screen.getByRole('dialog', { name: /tu pedido/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes with the Escape key', () => {
    render(<Cart />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cartValue.closeCart).toHaveBeenCalledTimes(1)
  })

  it('does not listen to Escape while closed', () => {
    cartValue = buildCart({ isOpen: false })
    render(<Cart />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cartValue.closeCart).not.toHaveBeenCalled()
  })

  it('has an accessible 44px close button', () => {
    render(<Cart />)
    const close = screen.getByRole('button', { name: /cerrar carrito/i })
    expect(close).toHaveClass('touch-target')
  })

  it('labels every customer field and uses 16px text to avoid iOS zoom', () => {
    render(<Cart />)
    for (const label of [/teléfono/i, /nombre/i, /mesa/i]) {
      const input = screen.getByLabelText(label)
      expect(input).toHaveClass('text-base')
      expect(input).not.toHaveClass('text-sm')
    }
    expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('autocomplete', 'tel')
    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('autocomplete', 'name')
  })

  it('shows an inline error instead of alert() for an invalid phone', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<Cart />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana')
    await user.type(screen.getByLabelText(/teléfono/i), '1234')
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/teléfono chileno válido/i)
    expect(screen.getByLabelText(/teléfono/i)).toHaveAttribute('aria-invalid', 'true')
    expect(alertSpy).not.toHaveBeenCalled()
    expect(cartValue.placeOrder).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('shows an inline error instead of alert() when the order fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    cartValue = buildCart({ placeOrder: vi.fn().mockResolvedValue({ success: false, error: 'Sin conexión' }) })
    const user = userEvent.setup()
    render(<Cart />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana')
    await user.type(screen.getByLabelText(/teléfono/i), '+56912345678')
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión')
    expect(alertSpy).not.toHaveBeenCalled()
    alertSpy.mockRestore()
  })

  it('still places the order with valid data', async () => {
    cartValue = buildCart({ placeOrder: vi.fn().mockResolvedValue({ success: false, error: 'x' }) })
    const user = userEvent.setup()
    render(<Cart />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana')
    await user.type(screen.getByLabelText(/teléfono/i), '912345678')
    await user.click(screen.getByRole('button', { name: /enviar pedido/i }))

    expect(cartValue.placeOrder).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana', phone: '912345678', tableNumber: '4' })
    )
  })
})

describe('Cart customer lookup', () => {
  it('never queries customers from the browser (anon is denied after the RLS lockdown)', async () => {
    supabase.from.mockClear()
    const user = userEvent.setup()
    render(<Cart />)

    await user.type(screen.getByLabelText(/teléfono/i), '+56998307778')
    await new Promise((resolve) => setTimeout(resolve, 1100))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/nombre/i)).toBeEnabled()
  })
})

describe('Action buttons use the shared Button', () => {
  const BRAND = 'bg-[var(--primary-color,var(--color-primary))]'

  it('styles the cart actions with the tenant brand and 44px targets', () => {
    render(<Cart />)
    const send = screen.getByRole('button', { name: /enviar pedido/i })
    expect(send).toHaveClass(BRAND, 'min-h-11')
    expect(screen.getByRole('button', { name: /limpiar/i })).toHaveClass('min-h-11')
  })

  it('styles the menu add button with the tenant brand', () => {
    render(<MenuCard product={product} />)
    expect(screen.getByRole('button', { name: /agregar un latte/i })).toHaveClass(BRAND, 'min-h-11')
  })
})

describe('CartItem', () => {
  it('uses 44px touch targets for every control', () => {
    render(<CartItem item={cartItem} />)
    for (const name of [/eliminar/i, /reducir cantidad/i, /aumentar cantidad/i, /notas/i]) {
      expect(screen.getByRole('button', { name })).toHaveClass('touch-target')
    }
  })

  it('names the product in control labels', () => {
    render(<CartItem item={cartItem} />)
    expect(screen.getByRole('button', { name: 'Eliminar Latte' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reducir cantidad de Latte' })).toBeInTheDocument()
  })

  it('lazy-loads the product image', () => {
    render(<CartItem item={cartItem} />)
    expect(screen.getByRole('img', { name: 'Latte' })).toHaveAttribute('loading', 'lazy')
  })

  it('labels the notes field with 16px text', async () => {
    const user = userEvent.setup()
    render(<CartItem item={cartItem} />)
    await user.click(screen.getByRole('button', { name: /notas/i }))
    expect(screen.getByLabelText(/notas para latte/i)).toHaveClass('text-base')
  })
})

describe('MenuCard', () => {
  it('lazy-loads the product image', () => {
    render(<MenuCard product={product} />)
    expect(screen.getByRole('img', { name: 'Latte' })).toHaveAttribute('loading', 'lazy')
  })

  it('exposes temperature choices as 44px toggle buttons', () => {
    render(<MenuCard product={product} />)
    const hot = screen.getByRole('button', { name: /caliente/i })
    const iced = screen.getByRole('button', { name: /helado/i })
    expect(hot).toHaveAttribute('aria-pressed', 'true')
    expect(iced).toHaveAttribute('aria-pressed', 'false')
    expect(hot).toHaveClass('touch-target')
  })

  it('labels the quantity controls with the product name', () => {
    cartValue = buildCart({ items: [cartItem] })
    render(<MenuCard product={product} />)
    expect(screen.getByRole('button', { name: 'Quitar un Latte' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar un Latte' })).toBeInTheDocument()
  })

  it('still adds the product with the selected temperature', async () => {
    cartValue = buildCart({ items: [] })
    const user = userEvent.setup()
    render(<MenuCard product={product} />)
    await user.click(screen.getByRole('button', { name: /helado/i }))
    await user.click(screen.getByRole('button', { name: 'Agregar un Latte' }))
    expect(cartValue.addItem).toHaveBeenCalledWith(product, 1, 'iced')
  })
})

describe('SearchBar', () => {
  it('labels the input and the clear button', async () => {
    const user = userEvent.setup()
    render(<SearchBar isVisible onSearch={vi.fn()} onClose={vi.fn()} />)
    const input = screen.getByRole('searchbox', { name: /buscar en el menú/i })
    expect(input).toHaveClass('text-base')
    await user.type(input, 'lat')
    expect(screen.getByRole('button', { name: /limpiar búsqueda/i })).toHaveClass('touch-target')
  })
})

describe('FloatingCartButton', () => {
  it('sits above the fixed table bar when a table is active', () => {
    render(<FloatingCartButton />)
    const button = screen.getByRole('button', { name: /ver carrito/i })
    expect(button).toHaveClass('bottom-20')
    expect(button).not.toHaveClass('bottom-6')
  })

  it('keeps the default offset outside a table session', () => {
    tenantValue = { tenant: tenantValue.tenant, table: null }
    render(<FloatingCartButton />)
    expect(screen.getByRole('button', { name: /ver carrito/i })).toHaveClass('bottom-6')
  })
})
