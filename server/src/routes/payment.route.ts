import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { authMiddleware } from '../middlewares/auth.middleware'
import {
  momoCreate,
  momoCallback,
  momoIPN,
  vnpayCreate,
  vnpayReturn,
  vnpayIPN,
  codConfirm,
} from '../controllers/payment.controller'

const router = Router()

// IPN endpoints: called by payment gateways — generous limit but still protected
const ipnLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
})

// ── MoMo ──────────────────────────────────────────────────────────────────
router.post('/momo/create',   authMiddleware, momoCreate)
router.post('/momo/callback', ipnLimiter, momoCallback)   // browser redirect from MoMo
router.post('/momo/ipn',      ipnLimiter, momoIPN)        // server-to-server from MoMo

// ── VNPay ─────────────────────────────────────────────────────────────────
router.post('/vnpay/create', authMiddleware, vnpayCreate)
router.get('/vnpay/return',  ipnLimiter, vnpayReturn)     // browser redirect from VNPay
router.post('/vnpay/ipn',    ipnLimiter, vnpayIPN)        // server-to-server from VNPay

// ── COD ───────────────────────────────────────────────────────────────────
router.post('/cod/confirm', authMiddleware, codConfirm)

export default router
