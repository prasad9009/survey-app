import express from 'express'
import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import mongoose from 'mongoose'
import { env } from './config/env.js'
import {
  getBrevoConfigHint,
  getBrevoFromEmail,
  getBrevoMailMode,
  isBrevoConfigured,
} from './services/mailService.js'
import { connectMongo, registerMongoShutdownHandlers } from './config/db.js'
import { startKeepAlive } from './services/keepAlive.js'
import { configureCloudinary } from './config/cloudinary.js'
import './models/index.js'
import apiRouter from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

if (!env.mongodbUri) {
  console.error('MongoDB connection string is required (set MONGO_URI or MONGODB_URI)')
  process.exit(1)
}

if (
  env.nodeEnv === 'production' &&
  (!env.jwtSecret || env.jwtSecret === 'dev-only-change-in-production')
) {
  console.error('JWT_SECRET must be set to a strong random value in production')
  process.exit(1)
}

configureCloudinary()
registerMongoShutdownHandlers()

if (!isBrevoConfigured()) {
  const hint = getBrevoConfigHint()
  console.warn('[startup] Password reset email disabled.', hint || 'Set BREVO_API_KEY + BREVO_FROM_EMAIL.')
} else {
  const hint = getBrevoConfigHint()
  console.info(`[startup] Password reset email via Brevo ${getBrevoMailMode()}`, hint ? `(${hint})` : '')
}

const app = express()
app.set('trust proxy', 1)
app.use(compression())
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
function isAllowedCorsOrigin(origin) {
  if (!origin) return true
  if (env.frontendOrigins.includes(origin)) return true
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true
  if (/^https:\/\/[\w.-]+\.vercel\.app$/.test(origin)) return true
  return false
}

app.use(
  cors({
    origin(origin, cb) {
      if (isAllowedCorsOrigin(origin)) return cb(null, true)
      cb(null, false)
    },
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// ─── Health / Keep-Alive Endpoints ────────────────────────────────────────────
// GET /health — Lightweight, DB-free probe. Ideal for UptimeRobot and Render
// health checks. Returns instantly so cold-start pings resolve fast.
app.get('/health', (_req, res) => {
  const mem = process.memoryUsage()
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    },
  })
})

// GET /health/db — Checks MongoDB connection readiness. Useful for debugging
// but NOT recommended as the Render healthCheckPath (it would delay cold starts).
app.get('/health/db', (_req, res) => {
  const state = mongoose.connection.readyState
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }
  const connected = state === 1
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    timestamp: new Date().toISOString(),
    mongo: stateMap[state] || 'unknown',
  })
})

app.get('/health/mail', (_req, res) => {
  const configured = isBrevoConfigured()
  res.status(configured ? 200 : 503).json({
    ok: configured,
    mode: getBrevoMailMode(),
    fromEmailSet: Boolean(getBrevoFromEmail()),
    hint: getBrevoConfigHint(),
  })
})

app.use('/api', apiRouter)

app.use(errorHandler)

try {
  await connectMongo(env.mongodbUri)
  console.info('MongoDB connected:', mongoose.connection.name)

  app.listen(env.port, () => {
    console.info(`API http://localhost:${env.port}`)

    // Start the self-ping keep-alive loop (production only).
    // This prevents Render free-tier from spinning down after 15 min of inactivity.
    startKeepAlive({ port: env.port })
  })
} catch (err) {
  console.error('Server failed to start', err)
  process.exit(1)
}
