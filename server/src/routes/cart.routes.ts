import { Router } from 'express'
import { getCart, addToCart, updateCartItemHandler, removeFromCart, clearCartHandler } from '../controllers/cart.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/', getCart)
router.post('/items', addToCart)
router.put('/items/:id', updateCartItemHandler)
router.delete('/items/:id', removeFromCart)
router.delete('/', clearCartHandler)

export default router
