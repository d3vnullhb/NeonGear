import { Router } from 'express'
import { adminListUsers, adminGetUser, adminUpdateUser, adminDeleteUser, adminToggleLock } from '../../controllers/user.controller'

const router = Router()

router.get('/', adminListUsers)
router.get('/:id', adminGetUser)
router.put('/:id/lock', adminToggleLock)
router.put('/:id', adminUpdateUser)
router.delete('/:id', adminDeleteUser)

export default router
