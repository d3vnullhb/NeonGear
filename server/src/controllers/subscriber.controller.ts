import { Request, Response } from 'express'
import {
  subscribeEmail,
  unsubscribeEmail,
  listSubscribers,
  deleteSubscriber,
  toggleSubscriberStatus,
  getSubscriberStats,
} from '../models/subscriber.model'

// ── Public ───────────────────────────────────────────────────────────────────

/** POST /api/v1/subscribers */
export const subscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, message: 'Email không hợp lệ' })
      return
    }
    await subscribeEmail(email.trim().toLowerCase())
    res.json({ success: true, message: 'Đăng ký nhận tin thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

/** POST /api/v1/subscribers/unsubscribe */
export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, message: 'Email là bắt buộc' })
      return
    }
    await unsubscribeEmail(email.trim().toLowerCase())
    res.json({ success: true, message: 'Đã huỷ đăng ký nhận tin' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

// ── Admin ────────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/subscribers */
export const adminListSubscribers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    const activeRaw = req.query.active as string | undefined
    const active = activeRaw === 'true' ? true : activeRaw === 'false' ? false : undefined

    const [subscribers, total] = await listSubscribers({ page, limit, active, search })
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy danh sách thành công', data: subscribers, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

/** GET /api/v1/admin/subscribers/stats */
export const adminSubscriberStats = async (_req: Request, res: Response) => {
  try {
    const stats = await getSubscriberStats()
    res.json({ success: true, message: 'Lấy thống kê thành công', data: stats })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

/** DELETE /api/v1/admin/subscribers/:id */
export const adminDeleteSubscriber = async (req: Request, res: Response) => {
  try {
    const subscriber_id = parseInt(req.params.id as string)
    await deleteSubscriber(subscriber_id)
    res.json({ success: true, message: 'Đã xoá subscriber' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

/** PATCH /api/v1/admin/subscribers/:id/toggle */
export const adminToggleSubscriber = async (req: Request, res: Response) => {
  try {
    const subscriber_id = parseInt(req.params.id as string)
    const updated = await toggleSubscriberStatus(subscriber_id)
    if (!updated) {
      res.status(404).json({ success: false, message: 'Không tìm thấy subscriber' })
      return
    }
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
