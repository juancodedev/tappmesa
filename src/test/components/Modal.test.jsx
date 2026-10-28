import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'

const Harness = ({ onClose = () => {}, ...props }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Modal
        isOpen={open}
        onClose={() => { onClose(); setOpen(false) }}
        title="Editar producto"
        {...props}
      >
        <input aria-label="Nombre" />
        <button>Guardar</button>
      </Modal>
    </>
  )
}

afterEach(() => {
  document.body.style.overflow = ''
})

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(<Modal isOpen={false} onClose={vi.fn()} title="X">contenido</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is a modal dialog named by its title', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Editar producto">contenido</Modal>)
    const dialog = screen.getByRole('dialog', { name: 'Editar producto' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Editar producto' })).toBeInTheDocument()
  })

  it('closes with Escape', () => {
    const onClose = vi.fn()
    render(<Modal isOpen onClose={onClose} title="X">contenido</Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('has an accessible 44px close button', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal isOpen onClose={onClose} title="X">contenido</Modal>)
    const close = screen.getByRole('button', { name: 'Cerrar' })
    expect(close).toHaveClass('touch-target')
    await user.click(close)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on backdrop click but not on panel click', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal isOpen onClose={onClose} title="X"><p>contenido</p></Modal>)
    await user.click(screen.getByText('contenido'))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('can disable backdrop dismissal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Modal isOpen onClose={onClose} title="X" closeOnBackdrop={false}>contenido</Modal>)
    await user.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('moves focus inside on open and restores it on close', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Abrir' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger).toHaveFocus()
  })

  it('keeps Tab focus inside the dialog', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 5; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement)
    }
    await user.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement)
  })

  it('locks body scroll while open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir' }))
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })

  it('applies the requested size', () => {
    render(<Modal isOpen onClose={vi.fn()} title="X" size="xl">contenido</Modal>)
    expect(screen.getByRole('dialog')).toHaveClass('max-w-4xl')
  })

  it('renders an optional description linked to the dialog', () => {
    render(<Modal isOpen onClose={vi.fn()} title="Nuevo Pedido" description="Mesa 4">contenido</Modal>)
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Mesa 4')
  })

  it('renders an optional footer', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="X" footer={<button>Confirmar</button>}>
        contenido
      </Modal>
    )
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })
})
