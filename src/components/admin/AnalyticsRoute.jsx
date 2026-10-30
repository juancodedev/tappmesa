import { lazy, Suspense } from 'react'
import * as Sentry from '@sentry/react'
import LoadingSpinner from '../ui/LoadingSpinner'
import { Button } from '../ui/Button'

// Lazy: the analytics screen pulls in the chart library, so it is its own chunk
// (see vite.config.js and src/test/config/chunks.test.js).
const Analytics = lazy(() => import('./Analytics'))

/** Keeps the admin shell up when a lazy chunk fails to load (stale tab, network). */
export const ChunkErrorBoundary = ({ children }) => (
  <Sentry.ErrorBoundary
    fallback={
      <div role="alert" className="m-6 flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        No se pudo cargar esta sección. Puede haber una versión nueva de la aplicación.
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Recargar página
        </Button>
      </div>
    }
  >
    {children}
  </Sentry.ErrorBoundary>
)

const AnalyticsRoute = () => (
  <ChunkErrorBoundary>
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <Analytics />
    </Suspense>
  </ChunkErrorBoundary>
)

export default AnalyticsRoute
