import { Router } from 'express'
import { getProductReviews, createReviewHandler, updateReviewHandler, deleteReviewHandler, getMyReviewsForProducts } from '../controllers/review.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { upload } from '../middlewares/upload.middleware'

const router = Router()

router.get('/my-products', authMiddleware, getMyReviewsForProducts)
router.get('/product/:productId', getProductReviews)
router.post('/', authMiddleware, upload.array('images', 5), createReviewHandler)
router.put('/:id', authMiddleware, updateReviewHandler)
router.delete('/:id', authMiddleware, deleteReviewHandler)

export default router
