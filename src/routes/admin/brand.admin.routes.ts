import { Router } from 'express'
import { adminListBrands, adminCreateBrand, adminUpdateBrand, adminDeleteBrand } from '../../controllers/brand.controller'
import { upload, uploadToCloudinary } from '../../middlewares/upload.middleware'

const router = Router()

router.get('/', adminListBrands)
router.post('/', upload.single('logo'), uploadToCloudinary('neongear/brands'), adminCreateBrand)
router.put('/:id', upload.single('logo'), uploadToCloudinary('neongear/brands'), adminUpdateBrand)
router.delete('/:id', adminDeleteBrand)

export default router
