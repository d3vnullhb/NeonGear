import { Router, Request, Response } from 'express'

const router = Router()

// Public endpoint — returns non-sensitive config needed by frontend
router.get('/payment', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      bank_id: process.env.BANK_ID ?? '',
      bank_short: process.env.BANK_SHORT ?? '',
      bank_account: process.env.BANK_ACCOUNT ?? '',
      bank_holder: process.env.BANK_HOLDER ?? '',
    },
  })
})

export default router
