import { Router } from 'express'
import { getProducts, getProductBySlugHandler, getProductFilterOptions } from '../controllers/product.controller'

const router = Router()

router.get('/', getProducts)
router.get('/filter-options', getProductFilterOptions)
router.get('/:slug', getProductBySlugHandler)

export default router
