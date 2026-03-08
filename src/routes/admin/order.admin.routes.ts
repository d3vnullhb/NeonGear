import { Router } from 'express'
import { adminListOrders, adminUpdateOrderStatus, getOrderByIdHandler } from '../../controllers/order.controller'

const router = Router()

router.get('/', adminListOrders)
router.get('/:id', getOrderByIdHandler)
router.put('/:id/status', adminUpdateOrderStatus)

export default router
