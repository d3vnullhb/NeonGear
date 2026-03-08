import { Router } from 'express'
import { adminListPosts, adminCreatePost, adminUpdatePost, adminDeletePost } from '../../controllers/post.controller'
import { upload, uploadToCloudinary } from '../../middlewares/upload.middleware'

const router = Router()

router.get('/', adminListPosts)
router.post('/', upload.single('thumbnail'), uploadToCloudinary('neongear/posts'), adminCreatePost)
router.put('/:id', upload.single('thumbnail'), uploadToCloudinary('neongear/posts'), adminUpdatePost)
router.delete('/:id', adminDeletePost)

export default router
