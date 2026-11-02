import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// call-waiter T4 (odd/tasks/call-waiter.md S1-S3, S6, S7).

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('../../services/api', () => ({ api }))

import CallWaiterButton from '../../components/table/CallWaiterButton'
import { POLL_INTERVAL_MS } from '../../utils/waiterCalls'

const session = { capability_token: 'ts_cap' }
const tenant = { id: 't1', waiter_calls_enabled: true }

const pending = (overrides = {}) => ({
  id: 'call-1',
  reason: 'assistance',
  status: 'pending',
  expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
  ...overrides,
})

describe('CallWaiterButton', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue({ call: null })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is hidden without a table session capability (S1)', () => {
    render(<CallWaiterButton tenant={tenant} tableSession={null} />)

    expect(screen.queryByRole('button', { name: /llamar al mesero/i })).not.toBeInTheDocument()
    expect(api.get).not.toHaveBeenCalled()
  })

  it('is hidden when the tenant disabled the feature (S7)', () => {
    render(<CallWaiterButton tenant={{ ...tenant, waiter_calls_enabled: false }} tableSession={session} />)

    expect(screen.queryByRole('button', { name: /llamar al mesero/i })).not.toBeInTheDocument()
  })

  it('sends the chosen reason and switches to the pending state (S2, S3)', async () => {
    api.post.mockResolvedValue({ call: pending({ reason: 'bill' }) })
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    await user.click(await screen.findByRole('button', { name: /llamar al mesero/i }))
    const dialog = screen.getByRole('dialog', { name: /llamar al mesero/i })
    expect(screen.getByRole('radio', { name: /necesito ayuda/i })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: /pedir la cuenta/i }))
    await user.click(screen.getByRole('button', { name: /^llamar$/i }))

    expect(api.post).toHaveBeenCalledWith('/api/waiter-calls', { capability: 'ts_cap', reason: 'bill' })
    expect(dialog).not.toBeInTheDocument()
    expect(await screen.findByText(/mesero en camino/i)).toBeInTheDocument()
    expect(screen.getByText(/pedir la cuenta/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancelar llamado/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/mesero en camino/i)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('closes the dialog with Escape without calling (S2)', async () => {
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    await user.click(await screen.findByRole('button', { name: /llamar al mesero/i }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('cancels the pending call and offers the button again (S2)', async () => {
    api.get.mockResolvedValue({ call: pending() })
    api.post.mockResolvedValue({ cancelled: true, call: pending({ status: 'cancelled' }) })
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    await user.click(await screen.findByRole('button', { name: /cancelar llamado/i }))

    expect(api.post).toHaveBeenCalledWith('/api/waiter-calls/call-1/cancel', { capability: 'ts_cap' })
    expect(await screen.findByRole('button', { name: /llamar al mesero/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/llamado cancelado/i)
  })

  it('restores a pending call on load (S4)', async () => {
    api.get.mockResolvedValue({ call: pending() })
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    expect(await screen.findByText(/mesero en camino/i)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/api/waiter-calls/current?capability=ts_cap')
  })

  it('shows the server message when calling again too soon (S5)', async () => {
    api.post.mockRejectedValue(Object.assign(new Error('Espera un momento antes de volver a llamar al mesero'), { status: 429 }))
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    await user.click(await screen.findByRole('button', { name: /llamar al mesero/i }))
    await user.click(screen.getByRole('button', { name: /^llamar$/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/espera un momento/i)
    expect(screen.getByRole('button', { name: /llamar al mesero/i })).toBeInTheDocument()
  })

  it('tells the customer when the waiter attended the call', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    api.get.mockResolvedValueOnce({ call: pending() }).mockResolvedValue({ call: pending({ status: 'attended' }) })
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)
    expect(await screen.findByText(/mesero en camino/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/tu llamado fue atendido/i))
    expect(screen.getByRole('button', { name: /llamar al mesero/i })).toBeInTheDocument()
  })

  it('lets the customer call again right away after an expiry (S6)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    api.get.mockResolvedValueOnce({ call: pending() }).mockResolvedValue({ call: pending({ status: 'expired' }) })
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)
    expect(await screen.findByText(/mesero en camino/i)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS)
    })

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/nadie respondió/i))
    expect(screen.getByRole('button', { name: /llamar al mesero/i })).toBeEnabled()
  })

  it('shows a cancel error while the call is still pending', async () => {
    api.get.mockResolvedValue({ call: pending() })
    api.post.mockRejectedValue(new Error('Sin conexión'))
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)

    await user.click(await screen.findByRole('button', { name: /cancelar llamado/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión')
    expect(screen.getByText(/mesero en camino/i)).toBeInTheDocument()
  })

  it('ignores a slow status read that started before a new call', async () => {
    let releaseStale
    api.get.mockReturnValueOnce(new Promise((resolve) => {
      releaseStale = () => resolve({ call: null })
    }))
    api.post.mockResolvedValue({ call: pending() })
    const user = userEvent.setup()
    render(<CallWaiterButton tenant={tenant} tableSession={session} />)
    await waitFor(() => expect(api.get).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: /llamar al mesero/i }))
    await user.click(screen.getByRole('button', { name: /^llamar$/i }))
    expect(await screen.findByText(/mesero en camino/i)).toBeInTheDocument()

    await act(async () => {
      releaseStale()
    })

    expect(screen.getByText(/mesero en camino/i)).toBeInTheDocument()
  })
})
