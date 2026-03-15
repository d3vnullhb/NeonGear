import { Router } from 'express'
import { getPostCategories } from '../controllers/postCategory.controller'

const router = Router()
router.get('/', getPostCategories)

export default router
