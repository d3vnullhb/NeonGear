import { Router } from 'express'
import authRoutes from './auth.routes'
import userRoutes from './user.routes'
import categoryRoutes from './category.routes'
import brandRoutes from './brand.routes'
import attributeRoutes from './attribute.routes'
import productRoutes from './product.routes'
import cartRoutes from './cart.routes'
import wishlistRoutes from './wishlist.routes'
import orderRoutes from './order.routes'
import reviewRoutes from './review.routes'
import couponRoutes from './coupon.routes'
import postRoutes from './post.routes'
import contactRoutes from './contact.routes'
import subscriberRoutes from './subscriber.routes'
import postCategoryRoutes from './postCategory.routes'
import adminRoutes from './admin'
import settingsRoutes from './settings.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/categories', categoryRoutes)
router.use('/brands', brandRoutes)
router.use('/attributes', attributeRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/wishlist', wishlistRoutes)
router.use('/orders', orderRoutes)
router.use('/reviews', reviewRoutes)
router.use('/coupons', couponRoutes)
router.use('/posts', postRoutes)
router.use('/contacts', contactRoutes)
router.use('/subscribers', subscriberRoutes)
router.use('/post-categories', postCategoryRoutes)
router.use('/admin', adminRoutes)
router.use('/settings', settingsRoutes)

export default router
