import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmProvider } from '../../context/ConfirmContext'
import { useConfirm } from '../../hooks/useConfirm'

let result
const Trigger = ({ message, options }) => {
  const confirm = useConfirm()
  return <button onClick={async () => { result = await confirm(message, options) }}>abrir</button>
}

const open = async (message = '¿Eliminar esta mesa?', options) => {
  result = undefined
  render(
    <ConfirmProvider>
      <Trigger message={message} options={options} />
    </ConfirmProvider>
  )
  await userEvent.click(screen.getByRole('button', { name: 'abrir' }))
  return screen.getByRole('dialog')
}

describe('ConfirmProvider', () => {
  it('shows the question in a labelled modal dialog', async () => {
    const dialog = await open()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleDescription('¿Eliminar esta mesa?')
  })

  it('resolves true when confirmed', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(result).toBe(true)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('resolves false when cancelled or dismissed with Escape', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(result).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: 'abrir' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    await screen.findByRole('button', { name: 'abrir' })
    expect(result).toBe(false)
  })

  it('focuses Cancel first so Enter never confirms a destructive action by accident', async () => {
    await open()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('accepts a custom confirm label and a danger tone', async () => {
    await open('¿Eliminar?', { confirmLabel: 'Eliminar', tone: 'danger' })
    expect(screen.getByRole('button', { name: 'Eliminar' })).toHaveClass('bg-red-600')
  })

  it('accepts a custom cancel label for ambiguous actions', async () => {
    await open('¿Cancelar este pedido?', { confirmLabel: 'Cancelar pedido', cancelLabel: 'Volver' })
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(result).toBe(false)
  })
})
