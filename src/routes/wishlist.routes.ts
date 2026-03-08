import { Router } from 'express'
import { getWishlistHandler, addToWishlistHandler, removeFromWishlistHandler } from '../controllers/wishlist.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/', getWishlistHandler)
router.post('/', addToWishlistHandler)
router.delete('/:id', removeFromWishlistHandler)

export default router
