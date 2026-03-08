import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  createOrder,
  getOrderById,
  listUserOrders,
  listAllOrders,
  updateOrderStatus,
  getOrderStatus,
  listOrderStatuses,
} from '../models/order.model'
import { getCartWithItems, clearCart, getOrCreateCart } from '../models/cart.model'
import { adjustInventory, addInventoryTransaction } from '../models/inventory.model'
import { getCouponByCode, getCouponUsageByUser, recordCouponUsage } from '../models/coupon.model'

export const getUserOrders = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [orders, total] = await listUserOrders(req.user!.user_id, page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy đơn hàng thành công', data: orders, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
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
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const placeOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { shipping_address, shipping_method, payment_method, note, coupon_code } = req.body
    if (!shipping_address) {
      res.status(400).json({ success: false, message: 'shipping_address là bắt buộc' })
      return
    }

    const cart = await getCartWithItems(req.user!.user_id)
    if (!cart || !cart.cart_items.length) {
      res.status(400).json({ success: false, message: 'Giỏ hàng trống' })
      return
    }

    // Validate inventory
    for (const item of cart.cart_items) {
      const inv = item.product_variants?.inventory
      if (!inv || inv.quantity < item.quantity) {
        res.status(400).json({ success: false, message: `Sản phẩm "${item.product_variants?.products?.name}" không đủ hàng` })
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

    const shipping_fee = 30000
    const final_amount = Math.max(0, total_amount - discount_amount + shipping_fee)

    const items = cart.cart_items.map((item) => ({
      variant_id: item.variant_id!,
      quantity: item.quantity,
      price: Number(item.product_variants?.price ?? 0),
      product_name: item.product_variants?.products?.name ?? '',
      sku: item.product_variants?.sku ?? '',
      variant_info: item.product_variants?.product_attribute_values?.map((v) => `${v.attributes?.name}: ${v.value}`).join(', '),
    }))

    const order = await createOrder({
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
      items,
    })

    // Deduct inventory
    await Promise.all(
      cart.cart_items.map(async (item) => {
        await adjustInventory(item.variant_id!, -item.quantity)
        await addInventoryTransaction({ variant_id: item.variant_id!, change_quantity: -item.quantity, transaction_type: 'sale', reference_id: order.order_id, note: `Đơn hàng ${order.order_code}` })
      })
    )

    // Record coupon usage
    if (coupon_id) await recordCouponUsage(req.user!.user_id, coupon_id, order.order_id)

    // Clear cart
    await clearCart(cart.cart_id)

    res.status(201).json({ success: true, message: 'Đặt hàng thành công', data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
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
    await updateOrderStatus(order_id, cancelledStatus.status_id, 'Huỷ bởi khách hàng')

    // Restore inventory
    await Promise.all(
      order.order_details.map(async (detail) => {
        if (detail.variant_id) {
          await adjustInventory(detail.variant_id, detail.quantity)
          await addInventoryTransaction({ variant_id: detail.variant_id, change_quantity: detail.quantity, transaction_type: 'return', reference_id: order_id, note: `Hoàn kho do huỷ đơn ${order.order_code}` })
        }
      })
    )

    res.json({ success: true, message: 'Huỷ đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
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
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
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
    await updateOrderStatus(order_id, parseInt(status_id), note)
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const getOrderStatuses = async (_req: AuthRequest, res: Response) => {
  try {
    const statuses = await listOrderStatuses()
    res.json({ success: true, message: 'Lấy trạng thái thành công', data: statuses })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
