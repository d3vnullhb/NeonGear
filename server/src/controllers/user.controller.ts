import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { getUserById, updateUser, listUsers, softDeleteUser, updateUserRole, toggleUserLock } from '../models/user.model'

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.user!.user_id)
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      return
    }
    res.json({ success: true, message: 'Lấy thông tin thành công', data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, phone, address, date_of_birth } = req.body
    const data: any = {}
    if (full_name) data.full_name = full_name
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    if (date_of_birth) data.date_of_birth = new Date(date_of_birth)

    const user = await updateUser(req.user!.user_id, data)
    res.json({ success: true, message: 'Cập nhật thành công', data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const cloudinaryUrl = (req as any).cloudinaryUrl
    if (!cloudinaryUrl) {
      res.status(400).json({ success: false, message: 'Không có ảnh được upload' })
      return
    }
    const user = await updateUser(req.user!.user_id, { avatar_url: cloudinaryUrl })
    res.json({ success: true, message: 'Cập nhật avatar thành công', data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListUsers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string | undefined
    const [users, total] = await listUsers(page, limit, search)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy danh sách người dùng thành công', data: users, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminGetUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(parseInt(req.params.id as string))
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      return
    }
    res.json({ success: true, message: 'Lấy thông tin thành công', data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = parseInt(req.params.id as string)
    const { role, full_name, phone, address } = req.body
    if (role) await updateUserRole(user_id, role)
    const data: any = {}
    if (full_name) data.full_name = full_name
    if (phone !== undefined) data.phone = phone
    if (address !== undefined) data.address = address
    const user = await updateUser(user_id, data)
    res.json({ success: true, message: 'Cập nhật thành công', data: user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteUser = async (req: AuthRequest, res: Response) => {
  try {
    await softDeleteUser(parseInt(req.params.id as string))
    res.json({ success: true, message: 'Xoá người dùng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminToggleLock = async (req: AuthRequest, res: Response) => {
  try {
    const user_id = parseInt(req.params.id as string)
    const { is_locked } = req.body
    if (typeof is_locked !== 'boolean') {
      res.status(400).json({ success: false, message: 'is_locked phải là boolean' })
      return
    }
    await toggleUserLock(user_id, is_locked)
    res.json({ success: true, message: is_locked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
