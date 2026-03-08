import { Router } from 'express'
import { adminListCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from '../../controllers/category.controller'
import { upload, uploadToCloudinary } from '../../middlewares/upload.middleware'

const router = Router()

router.get('/', adminListCategories)
router.post('/', upload.single('image'), uploadToCloudinary('neongear/categories'), adminCreateCategory)
router.put('/:id', upload.single('image'), uploadToCloudinary('neongear/categories'), adminUpdateCategory)
router.delete('/:id', adminDeleteCategory)

export default router
