import { Router } from 'express'
import { getProfile, updateProfile, uploadAvatar } from '../controllers/user.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { upload, uploadToCloudinary } from '../middlewares/upload.middleware'

const router = Router()

router.use(authMiddleware)

router.get('/me', getProfile)
router.put('/me', updateProfile)
router.post('/me/avatar', upload.single('avatar'), uploadToCloudinary('neongear/avatars'), uploadAvatar)

export default router
