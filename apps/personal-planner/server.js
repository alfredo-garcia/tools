/**
 * Servidor local para desarrollo y Docker: sirve estáticos (dist) y funciones en /api.
 * En producción despliega en Vercel (SPA + serverless).
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3000
const DIST = path.join(__dirname, 'dist')

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

function send(res, status, body, contentType = 'application/json') {
  res.setHeader('Content-Type', contentType)
  res.statusCode = status
  res.end(typeof body === 'string' ? body : JSON.stringify(body))
}

function serveFile(res, filePath) {
  const stream = fs.createReadStream(filePath)
  stream.on('error', () => send(res, 404, 'Not found', 'text/plain'))
  stream.pipe(res)
}

const MIMES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
}

// Rate limit: máx 120 peticiones por minuto por cliente (por IP + auth)
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 120
const rateLimit = new Map()
function getClientKey(req) {
  const auth = (req.headers?.authorization || req.headers?.Authorization || '').slice(0, 20)
  const ip = req.socket?.remoteAddress || 'unknown'
  return `${ip}:${auth}`
}
function checkRateLimit(req) {
  const key = getClientKey(req)
  const now = Date.now()
  let entry = rateLimit.get(key)
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
    rateLimit.set(key, entry)
  }
  entry.count++
  if (entry.count > RATE_LIMIT_MAX) return false
  return true
}
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rateLimit.entries()) {
    if (now > v.resetAt) rateLimit.delete(k)
  }
}, 30_000)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const pathname = url.pathname.replace(/\/$/, '') || '/'

  // API: /api/validate, /api/data, etc.
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(req)) {
      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Demasiadas peticiones. Espera un momento.' }))
      return
    }
    const name = pathname.slice(5).split('/')[0] || 'validate'
    let handler
    try {
      const modulePath = path.join(__dirname, 'api', `${name}.js`)
      const moduleUrl = pathToFileURL(modulePath).href
      const mod = await import(moduleUrl)
      handler = mod.default
    } catch (e) {
      console.error('API load error:', name, e.message)
      send(res, 404, { error: 'Not found' })
      return
    }
    // Parse body for POST
    if (req.method === 'POST') {
      const raw = await readBody(req)
      try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
    }
    req.url = pathname
    req.headers = req.headers
    handler(req, res)
    return
  }

  // Estáticos: dist (SPA). Si no existe dist (solo dev API), 404
  if (!fs.existsSync(DIST)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain')
    res.end('Not found. En desarrollo usa el frontend en http://localhost:5173')
    return
  }
  let file = path.join(DIST, pathname === '/' ? 'index.html' : pathname)
  if (!path.extname(file)) file = path.join(file, 'index.html')
  if (!file.startsWith(DIST)) {
    send(res, 403, 'Forbidden', 'text/plain')
    return
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    file = path.join(DIST, 'index.html')
  }
  const ext = path.extname(file)
  res.setHeader('Content-Type', MIMES[ext] || 'application/octet-stream')
  serveFile(res, file)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPuerto ${PORT} ya está en uso. Prueba:\n  PORT=3001 npm run dev:api\n\nO libera el puerto: lsof -i :${PORT}\n`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
