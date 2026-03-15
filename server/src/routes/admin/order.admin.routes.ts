import { Router } from 'express'
import { adminListOrders, adminUpdateOrderStatus, adminDeleteOrder, getOrderByIdHandler, getRevenueStatsHandler } from '../../controllers/order.controller'

const router = Router()

router.get('/revenue', getRevenueStatsHandler)
router.get('/', adminListOrders)
router.get('/:id', getOrderByIdHandler)
router.put('/:id/status', adminUpdateOrderStatus)
router.delete('/:id', adminDeleteOrder)

export default router
