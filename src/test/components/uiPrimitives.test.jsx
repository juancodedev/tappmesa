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

  it('renders Button, including asChild links', async () => {
    const { Button } = await import('../../components/ui/Button')

    render(
      <>
        <Button>Guardar</Button>
        <Button asChild variant="outline"><a href="/admin">Ir al panel</a></Button>
      </>
    )
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al panel' })).toHaveClass('inline-flex')
  })
})
