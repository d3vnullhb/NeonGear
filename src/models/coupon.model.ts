import prisma from '../config/db'

export const getCouponByCode = (code: string) =>
  prisma.coupons.findFirst({ where: { code, deleted_at: null } })

export const getCouponById = (coupon_id: number) =>
  prisma.coupons.findFirst({ where: { coupon_id, deleted_at: null } })

export const listCoupons = (page: number, limit: number) => {
  const where = { deleted_at: null }
  return Promise.all([
    prisma.coupons.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { created_at: 'desc' } }),
    prisma.coupons.count({ where }),
  ])
}

export const createCoupon = (data: {
  code: string
  discount_type?: string
  discount_value?: number
  min_order_amount?: number
  max_discount_amount?: number
  expiry_date?: Date
  usage_limit?: number
  per_user_limit?: number
  is_active?: boolean
}) => prisma.coupons.create({ data })

export const updateCoupon = (coupon_id: number, data: Record<string, any>) =>
  prisma.coupons.update({ where: { coupon_id }, data })

export const softDeleteCoupon = (coupon_id: number) =>
  prisma.coupons.update({ where: { coupon_id }, data: { deleted_at: new Date() } })

export const getCouponUsageByUser = (user_id: number, coupon_id: number) =>
  prisma.coupon_usages.count({ where: { user_id, coupon_id } })

export const recordCouponUsage = (user_id: number, coupon_id: number, order_id: number) =>
  prisma.$transaction([
    prisma.coupon_usages.create({ data: { user_id, coupon_id, order_id } }),
    prisma.coupons.update({ where: { coupon_id }, data: { used_count: { increment: 1 } } }),
  ])
