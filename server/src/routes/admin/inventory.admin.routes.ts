import { Router } from 'express'
import { adminListInventory, adminSetInventory, adminAdjustInventory, adminGetInventoryTransactions } from '../../controllers/inventory.controller'

const router = Router()

router.get('/', adminListInventory)
router.put('/variants/:variantId', adminSetInventory)
router.post('/variants/:variantId/adjust', adminAdjustInventory)
router.get('/variants/:variantId/transactions', adminGetInventoryTransactions)

export default router
