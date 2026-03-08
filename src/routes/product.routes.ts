import { Router } from 'express'
import { getProducts, getProductBySlugHandler } from '../controllers/product.controller'

const router = Router()

router.get('/', getProducts)
router.get('/:slug', getProductBySlugHandler)

export default router
