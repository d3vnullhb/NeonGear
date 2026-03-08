import { Router } from 'express'
import { getPosts, getPostBySlugHandler } from '../controllers/post.controller'

const router = Router()

router.get('/', getPosts)
router.get('/:slug', getPostBySlugHandler)

export default router
