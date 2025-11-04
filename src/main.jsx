import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
// import './index.css'

// Configurar Sentry solo en producción
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capturar 100% de transacciones en producción (ajustar según necesidad)
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% de sesiones normales
    replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
    // Environment
    environment: import.meta.env.MODE,
    // Release tracking
    release: `tappmesa@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // No enviar errores de desarrollo
    beforeSend(event, hint) {
      // Filtrar errores conocidos o de extensiones del navegador
      if (event.exception) {
        const error = hint.originalException
        // Ignorar errores de extensiones de Chrome
        if (error && error.message && error.message.includes('chrome-extension://')) {
          return null
        }
      }
      return event
    },
  })
}

// Configurar Sentry solo en producción
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capturar 100% de transacciones en producción (ajustar según necesidad)
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% de sesiones normales
    replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
    // Environment
    environment: import.meta.env.MODE,
    // Release tracking
    release: `tappmesa@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    // No enviar errores de desarrollo
    beforeSend(event, hint) {
      // Filtrar errores conocidos o de extensiones del navegador
      if (event.exception) {
        const error = hint.originalException
        // Ignorar errores de extensiones de Chrome
        if (error && error.message && error.message.includes('chrome-extension://')) {
          return null
        }
      }
      return event
    },
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
