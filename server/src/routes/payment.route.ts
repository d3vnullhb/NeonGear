import { Router } from 'express'
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

// ── MoMo ──────────────────────────────────────────────────────────────────
router.post('/momo/create',   authMiddleware, momoCreate)
router.post('/momo/callback', momoCallback)   // browser redirect from MoMo
router.post('/momo/ipn',      momoIPN)        // server-to-server from MoMo

// ── VNPay ─────────────────────────────────────────────────────────────────
router.post('/vnpay/create', authMiddleware, vnpayCreate)
router.get('/vnpay/return',  vnpayReturn)     // browser redirect from VNPay
router.post('/vnpay/ipn',    vnpayIPN)        // server-to-server from VNPay

// ── COD ───────────────────────────────────────────────────────────────────
router.post('/cod/confirm', authMiddleware, codConfirm)

export default router
