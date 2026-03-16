import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import router from './routes'
import paymentRouter from './routes/payment.route'
import prisma from './config/db'

// ── Startup validation ────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('[FATAL] JWT_SECRET is missing or too short (min 16 chars). Exiting.')
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT || 3000

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))

// ── CORS ──────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))

// ── Body parsers ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// ── Sanitize query params ─────────────────────────────────────────────────
app.use((req, _res, next) => {
  if (req.query.page !== undefined) {
    const p = parseInt(req.query.page as string)
    req.query.page = String(isNaN(p) || p < 1 ? 1 : p)
  }
  if (req.query.limit !== undefined) {
    const l = parseInt(req.query.limit as string)
    req.query.limit = String(isNaN(l) || l < 1 ? 20 : Math.min(l, 100))
  }
  if (typeof req.query.search === 'string') {
    req.query.search = req.query.search.trim().slice(0, 100)
  }
  next()
})

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', router)
app.use('/api/payment', paymentRouter)

// ── Health check (with DB ping) ───────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok' })
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
