import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// The ui/ primitives are not used by any screen yet, so the build alone does
// not prove their imports resolve. Rendering them here keeps them honest.
describe('ui primitives', () => {
  it('render without missing dependencies', async () => {
    const { Card } = await import('../../components/ui/Card')
    const { default: LoadingSpinner } = await import('../../components/ui/LoadingSpinner')
    const { default: Input } = await import('../../components/ui/Input')

    render(
      <>
        <Card>contenido</Card>
        <LoadingSpinner />
        <Input label="Correo" />
      </>
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })
})
