import React from 'react'
import * as Sentry from '@sentry/react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

class ErrorBoundaryFallback extends React.Component {
  render() {
    const { error, resetError } = this.props

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Ups! Algo salió mal
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Lo sentimos, hemos encontrado un error inesperado. Nuestro equipo ha sido notificado y trabajaremos para resolverlo.
            </p>

            {/* Error details (only in development) */}
            {import.meta.env.DEV && error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                <p className="text-xs font-mono text-red-600 break-all">
                  {error.toString()}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col space-y-3">
              <button
                onClick={resetError}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Intentar de nuevo</span>
              </button>

              <a
                href="/"
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span>Ir al inicio</span>
              </a>
            </div>

            {/* Support info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Si el problema persiste, contacta con{' '}
                <a href="mailto:soporte@tappmesa.com" className="text-primary hover:underline">
                  soporte@tappmesa.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Create the Sentry error boundary
const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }) => children,
  {
    fallback: (props) => <ErrorBoundaryFallback {...props} />,
    showDialog: false, // No mostrar el diálogo de Sentry por defecto
  }
)

export default SentryErrorBoundary
