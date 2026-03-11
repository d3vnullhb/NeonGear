import { Router } from 'express'
import { getAttributes, adminCreateAttribute, adminUpdateAttribute, adminDeleteAttribute } from '../../controllers/attribute.controller'

const router = Router()

router.get('/', getAttributes)
router.post('/', adminCreateAttribute)
router.put('/:id', adminUpdateAttribute)
router.delete('/:id', adminDeleteAttribute)

export default router
