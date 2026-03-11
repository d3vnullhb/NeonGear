import { Router } from 'express'
import { getAttributes } from '../controllers/attribute.controller'

const router = Router()

router.get('/', getAttributes)

export default router
