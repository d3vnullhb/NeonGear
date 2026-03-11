import { Router } from 'express'
import { validateCoupon } from '../controllers/coupon.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/validate', authMiddleware, validateCoupon)

export default router
