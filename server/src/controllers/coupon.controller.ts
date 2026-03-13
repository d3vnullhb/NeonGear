import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  getCouponByCode,
  getCouponById,
  listCoupons,
  listPublicCoupons,
  createCoupon,
  updateCoupon,
  softDeleteCoupon,
  getCouponUsageByUser,
} from '../models/coupon.model'

export const validateCoupon = async (req: AuthRequest, res: Response) => {
  try {
    const { code, order_amount } = req.body
    if (!code) {
      res.status(400).json({ success: false, message: 'code là bắt buộc' })
      return
    }

    const coupon = await getCouponByCode(code)
    if (!coupon || !coupon.is_active) {
      res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ' })
      return
    }
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' })
      return
    }
    if (coupon.usage_limit && coupon.used_count !== null && coupon.used_count >= coupon.usage_limit) {
      res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' })
      return
    }
    if (order_amount && coupon.min_order_amount && parseFloat(order_amount) < Number(coupon.min_order_amount)) {
      res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${coupon.min_order_amount}` })
      return
    }
    const usedCount = await getCouponUsageByUser(req.user!.user_id, coupon.coupon_id)
    if (coupon.per_user_limit && usedCount >= coupon.per_user_limit) {
      res.status(400).json({ success: false, message: 'Bạn đã dùng hết lượt của mã này' })
      return
    }

    let discount = 0
    const amount = parseFloat(order_amount) || 0
    if (coupon.discount_type === 'percent') {
      discount = (amount * Number(coupon.discount_value)) / 100
      if (coupon.max_discount_amount) discount = Math.min(discount, Number(coupon.max_discount_amount))
    } else {
      discount = Number(coupon.discount_value ?? 0)
    }

    res.json({ success: true, message: 'Mã giảm giá hợp lệ', data: { coupon, discount_amount: discount } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

// Public
export const getPublicCoupons = async (_req: Request, res: Response) => {
  try {
    const coupons = await listPublicCoupons()
    res.json({ success: true, message: 'Lấy coupon thành công', data: coupons })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

// Admin
export const adminListCoupons = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [coupons, total] = await listCoupons(page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy coupon thành công', data: coupons, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminCreateCoupon = async (req: Request, res: Response) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount_amount, expiry_date, usage_limit, per_user_limit, is_active } = req.body
    if (!code || !discount_type || !discount_value) {
      res.status(400).json({ success: false, message: 'code, discount_type và discount_value là bắt buộc' })
      return
    }
    const coupon = await createCoupon({
      code: code.toUpperCase(),
      discount_type,
      discount_value: parseFloat(discount_value),
      min_order_amount: min_order_amount ? parseFloat(min_order_amount) : undefined,
      max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : undefined,
      expiry_date: expiry_date ? new Date(expiry_date) : undefined,
      usage_limit: usage_limit ? parseInt(usage_limit) : undefined,
      per_user_limit: per_user_limit ? parseInt(per_user_limit) : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    })
    res.status(201).json({ success: true, message: 'Tạo coupon thành công', data: coupon })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminUpdateCoupon = async (req: Request, res: Response) => {
  try {
    const coupon_id = parseInt(req.params.id as string)
    const existing = await getCouponById(coupon_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy coupon' })
      return
    }
    const coupon = await updateCoupon(coupon_id, req.body)
    res.json({ success: true, message: 'Cập nhật coupon thành công', data: coupon })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminDeleteCoupon = async (req: Request, res: Response) => {
  try {
    const coupon_id = parseInt(req.params.id as string)
    const existing = await getCouponById(coupon_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy coupon' })
      return
    }
    await softDeleteCoupon(coupon_id)
    res.json({ success: true, message: 'Xoá coupon thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
