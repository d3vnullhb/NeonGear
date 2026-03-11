import { Router } from 'express'
import { register, login, changePassword, socialLogin, forgotPassword, resetPassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/social', socialLogin)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.put('/change-password', authMiddleware, changePassword)

export default router
