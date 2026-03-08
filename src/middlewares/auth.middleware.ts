import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { user_id: number; role: string }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      user_id: number
      role: string
    }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' })
  }
}
