/**
 * Dev server for API routes
 *
 * Corre las serverless functions de Vercel localmente durante desarrollo.
 * Se necesita para que /api/auth/* funcione en localhost:5173.
 *
 * Uso:
 *   node dev-server.js
 *   # En otra terminal: pnpm dev
 *
 * Luego Vite proxy-redirige /api/* a este servidor en :3001.
 */

const http = require('http')
const url = require('url')
const path = require('path')

// Cargar .env.local para que las API routes tengan acceso a las credenciales
try {
  require('dotenv').config({ path: path.join(__dirname, '.env.local') })
} catch {
  // dotenv puede no estar disponible en produccion
}

const PORT = 3001

// Map de rutas a handlers
const routes = {
  'POST:/api/auth/signin': require('./api/auth/signin'),
  'POST:/api/auth/signup': require('./api/auth/signup'),
  'POST:/api/auth/signout': require('./api/auth/signout'),
  'GET:/api/auth/session': require('./api/auth/session'),
  'POST:/api/auth/reset-password': require('./api/auth/reset-password'),
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname
  const method = req.method.toUpperCase()
  const routeKey = `${method}:${pathname}`

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const handler = routes[routeKey]

  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: `Route not found: ${method} ${pathname}` }))
    return
  }

  // Parsear body
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', async () => {
    try {
      if (body) {
        req.body = JSON.parse(body)
      } else {
        req.body = {}
      }
    } catch {
      req.body = {}
    }

    // Armar objeto res con los metodos que las API routes esperan
    const apiRes = {
      status(code) {
        res.statusCode = code
        return this
      },
      json(data) {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      },
      setHeader: (name, value) => res.setHeader(name, value),
      getHeader: (name) => res.getHeader(name),
      end: (data) => res.end(data),
    }

    try {
      await handler(req, apiRes)
    } catch (error) {
      console.error(`[dev-server] Error in ${routeKey}:`, error)
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Internal server error' }))
      }
    }
  })
})

server.listen(PORT, () => {
  console.log(`
🚀 Dev API server running on http://localhost:${PORT}
   Routes: POST /api/auth/signin, signup, signout, reset-password
           GET  /api/auth/session
   Proxied by Vite on http://localhost:5173/api/*
`)
})
