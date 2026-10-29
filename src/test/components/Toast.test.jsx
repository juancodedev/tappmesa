import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../../context/ToastContext'
import { useToast } from '../../hooks/useToast'

const Trigger = ({ kind, message }) => {
  const toast = useToast()
  return <button onClick={() => toast[kind](message)}>disparar</button>
}

const renderWith = (kind, message) =>
  render(
    <ToastProvider>
      <Trigger kind={kind} message={message} />
    </ToastProvider>
  )

afterEach(() => vi.useRealTimers())

describe('ToastProvider', () => {
  it('announces success messages politely', async () => {
    renderWith('success', 'Plan creado exitosamente')
    await userEvent.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByRole('status')).toHaveTextContent('Plan creado exitosamente')
  })

  it('announces errors assertively', async () => {
    renderWith('error', 'Error al guardar la mesa')
    await userEvent.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Error al guardar la mesa')
  })

  it('keeps line breaks of multi-line messages', async () => {
    renderWith('error', '2 errores:\nMesa 1\nMesa 2')
    await userEvent.click(screen.getByRole('button', { name: 'disparar' }))
    expect(screen.getByText(/2 errores/)).toHaveClass('whitespace-pre-line')
  })

  it('dismisses from an accessible 44px close button', async () => {
    renderWith('success', 'Guardado')
    await userEvent.click(screen.getByRole('button', { name: 'disparar' }))
    const close = screen.getByRole('button', { name: /cerrar notificación/i })
    expect(close).toHaveClass('touch-target')
    await userEvent.click(close)
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument()
  })

  it('auto-dismisses after a few seconds', () => {
    vi.useFakeTimers()
    renderWith('success', 'Guardado')
    act(() => screen.getByRole('button', { name: 'disparar' }).click())
    expect(screen.getByText('Guardado')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument()
  })

  it('throws a helpful error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger kind="success" message="x" />)).toThrow(/ToastProvider/)
  })
})
