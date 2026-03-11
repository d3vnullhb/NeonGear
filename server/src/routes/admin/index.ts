import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { adminMiddleware } from '../../middlewares/admin.middleware'
import userAdminRoutes from './user.admin.routes'
import categoryAdminRoutes from './category.admin.routes'
import brandAdminRoutes from './brand.admin.routes'
import attributeAdminRoutes from './attribute.admin.routes'
import productAdminRoutes from './product.admin.routes'
import orderAdminRoutes from './order.admin.routes'
import reviewAdminRoutes from './review.admin.routes'
import couponAdminRoutes from './coupon.admin.routes'
import postAdminRoutes from './post.admin.routes'
import contactAdminRoutes from './contact.admin.routes'
import inventoryAdminRoutes from './inventory.admin.routes'
import subscriberAdminRoutes from './subscriber.admin.routes'

const router = Router()

router.use(authMiddleware)
router.use(adminMiddleware)

router.use('/users', userAdminRoutes)
router.use('/categories', categoryAdminRoutes)
router.use('/brands', brandAdminRoutes)
router.use('/attributes', attributeAdminRoutes)
router.use('/products', productAdminRoutes)
router.use('/orders', orderAdminRoutes)
router.use('/reviews', reviewAdminRoutes)
router.use('/coupons', couponAdminRoutes)
router.use('/posts', postAdminRoutes)
router.use('/contacts', contactAdminRoutes)
router.use('/inventory', inventoryAdminRoutes)
router.use('/subscribers', subscriberAdminRoutes)

export default router
