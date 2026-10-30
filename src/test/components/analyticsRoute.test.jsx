import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChunkErrorBoundary } from '../../components/admin/AnalyticsRoute'

// The analytics screen is a lazy chunk (odd/tasks/analytics-dashboard.md, T2).
// If that chunk fails to load (stale tab after a deploy, network drop) only the
// route shows a message; the admin shell stays up.

const Broken = () => {
  throw new Error('Failed to fetch dynamically imported module')
}

describe('ChunkErrorBoundary', () => {
  it('replaces only the failed screen with a reload message', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <div>
        <nav>Admin shell</nav>
        <ChunkErrorBoundary>
          <Broken />
        </ChunkErrorBoundary>
      </div>
    )
    expect(screen.getByText('Admin shell')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar esta sección')
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument()
    console.error.mockRestore()
  })
})
