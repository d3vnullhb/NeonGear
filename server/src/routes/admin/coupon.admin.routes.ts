import { Router } from 'express'
import { adminListCoupons, adminCreateCoupon, adminUpdateCoupon, adminDeleteCoupon } from '../../controllers/coupon.controller'

const router = Router()

router.get('/', adminListCoupons)
router.post('/', adminCreateCoupon)
router.put('/:id', adminUpdateCoupon)
router.delete('/:id', adminDeleteCoupon)

export default router
