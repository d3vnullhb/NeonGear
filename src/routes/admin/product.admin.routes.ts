import { Router } from 'express'
import {
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminCreateVariant,
  adminUpdateVariant,
  adminDeleteVariant,
  adminUploadProductImages,
  adminDeleteProductImage,
} from '../../controllers/product.controller'
import { upload, uploadToCloudinary } from '../../middlewares/upload.middleware'

const router = Router()

// Products
router.get('/', adminListProducts)
router.get('/:id', adminGetProduct)
router.post('/', adminCreateProduct)
router.put('/:id', adminUpdateProduct)
router.delete('/:id', adminDeleteProduct)

// Variants
router.post('/:id/variants', upload.single('image'), uploadToCloudinary('neongear/variants'), adminCreateVariant)
router.put('/:id/variants/:variantId', upload.single('image'), uploadToCloudinary('neongear/variants'), adminUpdateVariant)
router.delete('/:id/variants/:variantId', adminDeleteVariant)

// Images
router.post('/:id/images', upload.array('images', 10), adminUploadProductImages)
router.delete('/:id/images/:imageId', adminDeleteProductImage)

export default router
