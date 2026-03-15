import { Router } from 'express'
import { getPostCategories, createPostCategoryHandler, updatePostCategoryHandler, deletePostCategoryHandler } from '../../controllers/postCategory.controller'

const router = Router()

router.get('/', getPostCategories)
router.post('/', createPostCategoryHandler)
router.put('/:id', updatePostCategoryHandler)
router.delete('/:id', deletePostCategoryHandler)

export default router
