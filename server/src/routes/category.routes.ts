import { Router } from 'express'
import { getCategories, getCategoryBySlugHandler } from '../controllers/category.controller'

const router = Router()

router.get('/', getCategories)
router.get('/:slug', getCategoryBySlugHandler)

export default router
