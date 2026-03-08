import { Router } from 'express'
import { adminListReviews, adminApproveReview, deleteReviewHandler } from '../../controllers/review.controller'

const router = Router()

router.get('/', adminListReviews)
router.put('/:id/approve', adminApproveReview)
router.delete('/:id', deleteReviewHandler)

export default router
