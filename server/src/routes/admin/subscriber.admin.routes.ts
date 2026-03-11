import { Router } from 'express'
import {
  adminListSubscribers,
  adminSubscriberStats,
  adminDeleteSubscriber,
  adminToggleSubscriber,
} from '../../controllers/subscriber.controller'

const router = Router()

router.get('/stats', adminSubscriberStats)
router.get('/', adminListSubscribers)
router.delete('/:id', adminDeleteSubscriber)
router.patch('/:id/toggle', adminToggleSubscriber)

export default router
