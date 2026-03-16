import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { createContact, listContacts, getContactById, replyContact } from '../models/contact.model'

export const submitContact = async (req: Request, res: Response) => {
  try {
    const { full_name, email, phone, subject, message } = req.body
    if (!full_name || !email || !subject || !message) {
      res.status(400).json({ success: false, message: 'full_name, email, subject và message là bắt buộc' })
      return
    }

    const user_id = (req as AuthRequest).user?.user_id
    const contact = await createContact({ user_id, full_name, email, phone, subject, message })
    res.status(201).json({ success: true, message: 'Gửi liên hệ thành công', data: contact })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListContacts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string | undefined
    const [contacts, total] = await listContacts(page, limit, status)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy liên hệ thành công', data: contacts, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminReplyContact = async (req: AuthRequest, res: Response) => {
  try {
    const contact_id = parseInt(req.params.id as string)
    const { reply } = req.body
    if (!reply) {
      res.status(400).json({ success: false, message: 'reply là bắt buộc' })
      return
    }
    const existing = await getContactById(contact_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' })
      return
    }
    const contact = await replyContact(contact_id, req.user!.user_id, reply)
    res.json({ success: true, message: 'Trả lời liên hệ thành công', data: contact })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
