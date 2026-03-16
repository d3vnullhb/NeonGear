import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, changePassword, socialLogin, forgotPassword, resetPassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.post('/social', authLimiter, socialLogin)
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)
router.put('/change-password', authMiddleware, changePassword)

export default router
