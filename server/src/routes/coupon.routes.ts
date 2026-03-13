import { Router } from 'express'
import { getPublicCoupons, validateCoupon } from '../controllers/coupon.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', getPublicCoupons)
router.post('/validate', authMiddleware, validateCoupon)

export default router
