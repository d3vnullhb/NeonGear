import { Router } from 'express'
import { getBrands, getBrandBySlugHandler } from '../controllers/brand.controller'

const router = Router()

router.get('/', getBrands)
router.get('/:slug', getBrandBySlugHandler)

export default router
