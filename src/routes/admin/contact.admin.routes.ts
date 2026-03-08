import { Router } from 'express'
import { adminListContacts, adminReplyContact } from '../../controllers/contact.controller'

const router = Router()

router.get('/', adminListContacts)
router.put('/:id/reply', adminReplyContact)

export default router
