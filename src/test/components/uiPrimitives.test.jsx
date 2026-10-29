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

  it('maps variants to theme tokens that exist in index.css', async () => {
    const { buttonVariants } = await import('../../components/ui/Button')

    expect(buttonVariants()).toMatch(/\bbg-primary\b/)
    expect(buttonVariants()).toMatch(/\btext-white\b/)
    expect(buttonVariants({ variant: 'destructive' })).toMatch(/\bbg-red-600\b/)
    // shadcn tokens missing from the theme must not leak in
    expect(buttonVariants({ variant: 'destructive' })).not.toMatch(/destructive/)
    expect(buttonVariants()).not.toMatch(/primary-foreground|ring-ring/)
  })

  it('offers a brand variant driven by the tenant color with readable text', async () => {
    const { buttonVariants } = await import('../../components/ui/Button')
    const brand = buttonVariants({ variant: 'brand' })

    expect(brand).toContain('bg-[var(--primary-color,var(--color-primary))]')
    expect(brand).toContain('text-[color:var(--primary-foreground,white)]')
  })

  it('uses 44px touch targets by default', async () => {
    const { buttonVariants } = await import('../../components/ui/Button')
    expect(buttonVariants()).toMatch(/\bmin-h-11\b/)
    expect(buttonVariants({ size: 'icon' })).toMatch(/\bmin-h-11\b.*\bmin-w-11\b|\bmin-w-11\b.*\bmin-h-11\b/)
  })
})
