import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  getOrderById,
  listUserOrders,
  listAllOrders,
  updateOrderStatus,
  deleteOrder,
  getOrderStatus,
  listOrderStatuses,
  getRevenueStats,
} from '../models/order.model'
import { getCartWithItems, clearCart } from '../models/cart.model'
import { adjustInventory, addInventoryTransaction } from '../models/inventory.model'
import { randomBytes } from 'crypto'
import { getCouponByCode, getCouponUsageByUser } from '../models/coupon.model'
import { findUserById } from '../models/auth.model'
import prisma from '../config/db'
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../lib/mail'

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [orders, total] = await listUserOrders(req.user!.user_id, page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy đơn hàng thành công', data: orders, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getOrderByIdHandler = async (req: AuthRequest, res: Response) => {
  try {
    const order = await getOrderById(parseInt(req.params.id as string))
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    if (req.user!.role !== 'admin' && order.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    res.json({ success: true, message: 'Lấy đơn hàng thành công', data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { shipping_address, shipping_method, payment_method, note, coupon_code } = req.body
    if (!shipping_address) {
      res.status(400).json({ success: false, message: 'shipping_address là bắt buộc' })
      return
    }
    if (typeof shipping_address !== 'string' || shipping_address.trim().length < 10 || shipping_address.length > 500) {
      res.status(400).json({ success: false, message: 'Địa chỉ giao hàng không hợp lệ (10–500 ký tự)' })
      return
    }

    const cart = await getCartWithItems(req.user!.user_id)
    if (!cart || !cart.cart_items.length) {
      res.status(400).json({ success: false, message: 'Giỏ hàng trống' })
      return
    }

    // Validate inventory (use Number() to handle Prisma Decimal type from PrismaPg adapter)
    for (const item of cart.cart_items) {
      const inv = item.product_variants?.inventory
      const currentQty = Number(inv?.quantity ?? 0)
      if (currentQty < item.quantity) {
        res.status(400).json({ success: false, message: `Sản phẩm "${item.product_variants?.products?.name}" không đủ hàng (còn ${currentQty} | yêu cầu ${item.quantity})` })
        return
      }
    }

    const pendingStatus = await getOrderStatus('pending')
    if (!pendingStatus) {
      res.status(500).json({ success: false, message: 'Không tìm thấy trạng thái đơn hàng' })
      return
    }

    // Calculate amounts
    const total_amount = cart.cart_items.reduce((sum, item) => {
      return sum + Number(item.product_variants?.price ?? 0) * item.quantity
    }, 0)

    let discount_amount = 0
    let coupon_id: number | undefined

    if (coupon_code) {
      const coupon = await getCouponByCode(coupon_code)
      if (!coupon || !coupon.is_active) {
        res.status(400).json({ success: false, message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' })
        return
      }
      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
        res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' })
        return
      }
      if (coupon.usage_limit && coupon.used_count && coupon.used_count >= coupon.usage_limit) {
        res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' })
        return
      }
      if (coupon.min_order_amount && total_amount < Number(coupon.min_order_amount)) {
        res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${coupon.min_order_amount} để dùng mã này` })
        return
      }
      const usedCount = await getCouponUsageByUser(req.user!.user_id, coupon.coupon_id)
      if (coupon.per_user_limit && usedCount >= coupon.per_user_limit) {
        res.status(400).json({ success: false, message: 'Bạn đã dùng hết lượt của mã này' })
        return
      }
      coupon_id = coupon.coupon_id
      if (coupon.discount_type === 'percent') {
        discount_amount = (total_amount * Number(coupon.discount_value)) / 100
        if (coupon.max_discount_amount) discount_amount = Math.min(discount_amount, Number(coupon.max_discount_amount))
      } else {
        discount_amount = Number(coupon.discount_value ?? 0)
      }
    }

    const shipping_fee = shipping_method === 'express' ? 50000 : total_amount >= 500000 ? 0 : 30000
    const final_amount = Math.max(0, total_amount - discount_amount + shipping_fee)

    const items = cart.cart_items.map((item) => ({
      variant_id: item.variant_id!,
      quantity: item.quantity,
      price: Number(item.product_variants?.price ?? 0),
      product_name: item.product_variants?.products?.name ?? '',
      sku: item.product_variants?.sku ?? '',
      variant_info: item.product_variants?.product_attribute_values?.map((v) => `${v.attributes?.name}: ${v.value}`).join(', '),
    }))

    const order = await prisma.$transaction(async (tx) => {
      // Deduct inventory atomically — if any item runs out, entire transaction rolls back
      for (const item of cart.cart_items) {
        const delta = -item.quantity
        const updated = await tx.$executeRaw`
          UPDATE inventory
          SET quantity = quantity + ${delta}, updated_at = NOW()
          WHERE variant_id = ${item.variant_id!} AND quantity + ${delta} >= 0
        `
        if (updated === 0) {
          throw new Error(`Sản phẩm "${item.product_variants?.products?.name}" không đủ tồn kho`)
        }
      }

      // Create order
      const newOrder = await tx.orders.create({
        data: {
          user_id: req.user!.user_id,
          total_amount,
          discount_amount,
          shipping_fee,
          final_amount,
          coupon_id,
          shipping_address,
          shipping_method,
          payment_method,
          note,
          status_id: pendingStatus.status_id,
          order_code: `NG${randomBytes(5).toString('hex').toUpperCase()}`,
          order_details: { create: items },
          order_status_history: { create: [{ status_id: pendingStatus.status_id, note: 'Đơn hàng được tạo' }] },
        },
        include: { order_details: true, order_status: true },
      })

      // Log inventory transactions
      await Promise.all(
        cart.cart_items.map((item) =>
          tx.inventory_transactions.create({
            data: { variant_id: item.variant_id!, change_quantity: -item.quantity, transaction_type: 'export', reference_id: newOrder.order_id, note: `Đơn hàng ${newOrder.order_code}` },
          })
        )
      )

      // Record coupon usage
      if (coupon_id) {
        await tx.coupon_usages.create({ data: { user_id: req.user!.user_id, coupon_id, order_id: newOrder.order_id } })
        await tx.coupons.update({ where: { coupon_id }, data: { used_count: { increment: 1 } } })
      }

      return newOrder
    })

    // Clear cart — outside transaction, non-critical
    await clearCart(cart.cart_id)

    // Send confirmation email — fire and forget
    findUserById(req.user!.user_id).then((u) => {
      if (!u?.email) return
      return sendOrderConfirmationEmail(u.email, {
        order_code: order.order_code,
        final_amount: Number(order.final_amount),
        shipping_address: order.shipping_address,
        items: order.order_details.map((d) => ({
          product_name: d.product_name,
          quantity: d.quantity,
          price: Number(d.price),
        })),
      })
    }).catch((e) => console.error('[mail] order confirmation failed — order:', order.order_code, '—', e?.message ?? e))

    res.status(201).json({ success: true, message: 'Đặt hàng thành công', data: order })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[placeOrder]', msg)
    res.status(500).json({ success: false, message: `Lỗi server: ${msg}` })
  }
}

export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order_id = parseInt(req.params.id as string)
    const order = await getOrderById(order_id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    if (order.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    if (order.order_status?.name !== 'pending') {
      res.status(400).json({ success: false, message: 'Chỉ có thể huỷ đơn hàng ở trạng thái chờ xử lý' })
      return
    }
    const cancelledStatus = await getOrderStatus('cancelled')
    if (!cancelledStatus) {
      res.status(500).json({ success: false, message: 'Không tìm thấy trạng thái đơn hàng' })
      return
    }
    await prisma.$transaction(async (tx) => {
      // Update order status + history atomically
      await tx.orders.update({ where: { order_id }, data: { status_id: cancelledStatus.status_id } })
      await tx.order_status_history.create({ data: { order_id, status_id: cancelledStatus.status_id, note: 'Huỷ bởi khách hàng' } })

      // Restore inventory for all items atomically — if any fails, all roll back
      for (const detail of order.order_details) {
        if (!detail.variant_id) continue
        await tx.$executeRaw`
          UPDATE inventory SET quantity = quantity + ${detail.quantity}, updated_at = NOW()
          WHERE variant_id = ${detail.variant_id}
        `
        await tx.inventory_transactions.create({
          data: { variant_id: detail.variant_id, change_quantity: detail.quantity, transaction_type: 'cancel_return', reference_id: order_id, note: `Hoàn kho do huỷ đơn ${order.order_code}` },
        })
      }
    })

    res.json({ success: true, message: 'Huỷ đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    const order_id = parseInt(req.params.id as string)
    const order = await getOrderById(order_id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    const statusName = order.order_status?.name
    if (statusName !== 'cancelled' && statusName !== 'delivered') {
      res.status(400).json({ success: false, message: 'Chỉ có thể xoá đơn đã huỷ hoặc đã giao thành công' })
      return
    }
    await deleteOrder(order_id)
    res.json({ success: true, message: 'Xoá đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListOrders = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status_id = req.query.status_id ? parseInt(req.query.status_id as string) : undefined
    const search = req.query.search as string | undefined
    const [orders, total] = await listAllOrders({ page, limit, status_id, search })
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy đơn hàng thành công', data: orders, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const order_id = parseInt(req.params.id as string)
    const { status_id, note } = req.body
    if (!status_id) {
      res.status(400).json({ success: false, message: 'status_id là bắt buộc' })
      return
    }
    const order = await getOrderById(order_id)
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    const [allStatuses, newStatus] = await Promise.all([listOrderStatuses(), getOrderStatus('cancelled')])
    const newStatusName = allStatuses.find((s) => s.status_id === parseInt(status_id))?.name ?? ''
    const isCancelling = newStatus && parseInt(status_id) === newStatus.status_id
    const alreadyCancelledOrDelivered = order.order_status?.name === 'cancelled' || order.order_status?.name === 'delivered'

    // Idempotency: skip if already in target status
    if (order.status_id === parseInt(status_id)) {
      res.json({ success: true, message: 'Trạng thái đơn hàng không thay đổi' })
      return
    }

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({ where: { order_id }, data: { status_id: parseInt(status_id) } })
      await tx.order_status_history.create({ data: { order_id, status_id: parseInt(status_id), note } })

      // Restore inventory when admin cancels atomically
      if (isCancelling && !alreadyCancelledOrDelivered) {
        for (const detail of order.order_details) {
          if (!detail.variant_id) continue
          await tx.$executeRaw`
            UPDATE inventory SET quantity = quantity + ${detail.quantity}, updated_at = NOW()
            WHERE variant_id = ${detail.variant_id}
          `
          await tx.inventory_transactions.create({
            data: { variant_id: detail.variant_id, change_quantity: detail.quantity, transaction_type: 'cancel_return', reference_id: order_id, note: `Hoàn kho do admin huỷ đơn ${order.order_code}` },
          })
        }
      }
    })

    // Send status update email — fire and forget
    if (order.users?.email) {
      sendOrderStatusEmail(order.users.email, {
        order_code: order.order_code,
        status_name: newStatusName,
        note,
      }).catch((e) => console.error('[mail] status email failed — order:', order.order_code, '—', e?.message ?? e))
    }

    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getOrderStatuses = async (_req: AuthRequest, res: Response) => {
  try {
    const statuses = await listOrderStatuses()
    res.json({ success: true, message: 'Lấy trạng thái thành công', data: statuses })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getRevenueStatsHandler = async (req: AuthRequest, res: Response) => {
  try {
    const rawGroupBy = req.query.groupBy as string
    const valid = ['day', 'week', 'month', 'quarter', 'year']
    const groupBy = valid.includes(rawGroupBy) ? (rawGroupBy as 'day' | 'week' | 'month' | 'quarter' | 'year') : 'month'
    let startDate: Date | undefined
    let endDate: Date | undefined
    if (req.query.startDate) { startDate = new Date(req.query.startDate as string) }
    if (req.query.endDate) { endDate = new Date(req.query.endDate as string); endDate.setHours(23, 59, 59, 999) }
    const data = await getRevenueStats({ groupBy, startDate, endDate })
    res.json({ success: true, message: 'Lấy thống kê doanh thu thành công', data })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
