import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLogin,
  updatePassword,
  findOrCreateSocialUser,
} from '../models/auth.model'
import { AuthRequest } from '../middlewares/auth.middleware'

const SALT_ROUNDS = 10

const signToken = (user_id: number, role: string) =>
  jwt.sign({ user_id, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions)

export const register = async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, phone } = req.body

    if (!full_name || !email || !password) {
      res.status(400).json({ success: false, message: 'full_name, email và password là bắt buộc' })
      return
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      res.status(400).json({ success: false, message: 'Email đã được sử dụng' })
      return
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await createUser({ full_name, email, password_hash, phone })

    const token = signToken(user.user_id, user.role ?? 'user')

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: { user, token },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email và password là bắt buộc' })
      return
    }

    const user = await findUserByEmail(email)
    if (!user) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' })
      return
    }

    if (user.is_locked) {
      res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' })
      return
    }

    await updateLastLogin(user.user_id)

    const token = signToken(user.user_id, user.role ?? 'user')

    const { password_hash: _, ...safeUser } = user

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: { user: safeUser, token },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const socialLogin = async (req: Request, res: Response) => {
  try {
    const { provider, access_token } = req.body
    if (!provider || !access_token) {
      res.status(400).json({ success: false, message: 'provider và access_token là bắt buộc' })
      return
    }

    let profile: { name: string; email: string; picture?: string }

    if (provider === 'google') {
      const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      if (!resp.ok) {
        res.status(401).json({ success: false, message: 'Token Google không hợp lệ' })
        return
      }
      const gUser: any = await resp.json()
      profile = { name: gUser.name, email: gUser.email, picture: gUser.picture }
    } else if (provider === 'facebook') {
      const resp = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`)
      if (!resp.ok) {
        res.status(401).json({ success: false, message: 'Token Facebook không hợp lệ' })
        return
      }
      const fbUser: any = await resp.json()
      if (!fbUser.email) {
        res.status(400).json({ success: false, message: 'Tài khoản Facebook chưa liên kết email' })
        return
      }
      profile = { name: fbUser.name, email: fbUser.email, picture: fbUser.picture?.data?.url }
    } else {
      res.status(400).json({ success: false, message: 'Provider không hợp lệ (google | facebook)' })
      return
    }

    const user = await findOrCreateSocialUser({
      full_name: profile.name,
      email: profile.email,
      avatar_url: profile.picture,
    })
    await updateLastLogin(user.user_id)
    const token = signToken(user.user_id, user.role ?? 'user')
    const { password_hash: _, ...safeUser } = user

    res.json({ success: true, message: 'Đăng nhập thành công', data: { user: safeUser, token } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) {
      res.status(400).json({ success: false, message: 'Email là bắt buộc' })
      return
    }

    const user = await findUserByEmail(email)
    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ success: true, message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi' })
      return
    }

    const resetToken = jwt.sign(
      { user_id: user.user_id, type: 'reset' },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' } as jwt.SignOptions
    )

    // In production: send email with reset link
    // For now: log token (replace with nodemailer when SMTP is configured)
    const resetUrl = `${process.env.CLIENT_URL ?? 'http://localhost:5173'}/reset-password?token=${resetToken}`
    console.log(`[RESET PASSWORD] ${email} → ${resetUrl}`)

    res.json({ success: true, message: 'Nếu email tồn tại, link đặt lại mật khẩu đã được gửi' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, new_password } = req.body

    if (!token || !new_password) {
      res.status(400).json({ success: false, message: 'token và new_password là bắt buộc' })
      return
    }

    if (new_password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }

    let payload: any
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string)
    } catch {
      res.status(400).json({ success: false, message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' })
      return
    }

    if (payload.type !== 'reset') {
      res.status(400).json({ success: false, message: 'Token không hợp lệ' })
      return
    }

    const user = await findUserById(payload.user_id)
    if (!user) {
      res.status(404).json({ success: false, message: 'Người dùng không tồn tại' })
      return
    }

    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS)
    await updatePassword(user.user_id, password_hash)

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { old_password, new_password } = req.body
    const user_id = req.user!.user_id

    if (!old_password || !new_password) {
      res.status(400).json({ success: false, message: 'old_password và new_password là bắt buộc' })
      return
    }

    if (new_password.length < 6) {
      res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
      return
    }

    const user = await findUserById(user_id)
    if (!user) {
      res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' })
      return
    }

    const isMatch = await bcrypt.compare(old_password, user.password_hash)
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Mật khẩu cũ không đúng' })
      return
    }

    const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS)
    await updatePassword(user_id, password_hash)

    res.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
