import { Router } from 'express'
import { getUserOrders, getOrderByIdHandler, placeOrder, cancelOrder, getOrderStatuses } from '../controllers/order.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.get('/statuses', getOrderStatuses)

router.use(authMiddleware)

router.get('/', getUserOrders)
router.get('/:id', getOrderByIdHandler)
router.post('/', placeOrder)
router.post('/:id/cancel', cancelOrder)

export default router
