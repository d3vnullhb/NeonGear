import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { getOrderById, getOrderStatus, updateOrderStatus } from '../models/order.model'
import { createMoMoPayment, verifyMoMoSignature, parseMomoOrderId } from '../services/payment/momo.service'
import { createVNPayPayment, verifyVNPaySignature, parseVnpayOrderId } from '../services/payment/vnpay.service'
import prisma from '../config/db'

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Khi thanh toán online thất bại: hoàn kho + cập nhật status = 'failed' trong 1 transaction.
 * Dùng transaction để đảm bảo idempotency — nếu cả vnpayReturn và vnpayIPN cùng gọi,
 * chỉ handler đầu tiên thực hiện (handler sau thấy status != 'pending' thì bỏ qua).
 */
async function handlePaymentFailure(orderId: number, note: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { order_id: orderId },
      include: { order_status: true, order_details: true },
    })
    // Chỉ xử lý nếu đơn đang ở trạng thái 'pending' (chưa được xử lý bởi handler khác)
    if (!order || order.order_status?.name !== 'pending') return

    const failedStatus = await tx.order_status.findUnique({ where: { name: 'failed' } })
    if (!failedStatus) return

    await tx.orders.update({ where: { order_id: orderId }, data: { status_id: failedStatus.status_id } })
    await tx.order_status_history.create({ data: { order_id: orderId, status_id: failedStatus.status_id, note } })

    // Hoàn kho cho tất cả items
    for (const detail of order.order_details) {
      if (!detail.variant_id) continue
      await tx.$executeRaw`
        UPDATE inventory SET quantity = quantity + ${detail.quantity}, updated_at = NOW()
        WHERE variant_id = ${detail.variant_id}
      `
      await tx.inventory_transactions.create({
        data: {
          variant_id: detail.variant_id,
          change_quantity: detail.quantity,
          transaction_type: 'cancel_return',
          reference_id: orderId,
          note: `Hoàn kho do thanh toán thất bại`,
        },
      })
    }
  })
}

async function resolveStatus(name: string) {
  const s = await getOrderStatus(name)
  if (!s) throw new Error(`Không tìm thấy trạng thái "${name}" trong DB`)
  return s
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim()
    return ip.replace(/^::ffff:/, '')
  }
  const addr = req.socket?.remoteAddress ?? '127.0.0.1'
  // Convert IPv6 loopback / IPv4-mapped IPv6 to plain IPv4
  if (addr === '::1') return '127.0.0.1'
  return addr.replace(/^::ffff:/, '')
}

// ─── MoMo ───────────────────────────────────────────────────────────────────

/** POST /api/payment/momo/create  (authenticated) */
export const momoCreate = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, amount, orderInfo } = req.body as { orderId: number; amount: number; orderInfo: string }

    if (!orderId || !amount) {
      res.status(400).json({ success: false, message: 'orderId và amount là bắt buộc' })
      return
    }

    const order = await getOrderById(Number(orderId))
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    if (order.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const result = await createMoMoPayment(
      Number(orderId),
      Number(amount),
      orderInfo || `Thanh toán đơn hàng #${order.order_code}`,
    )

    res.json({ success: result.success, message: result.message, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

/**
 * POST /api/payment/momo/callback  — MoMo redirects the user browser here after payment.
 * In practice, redirect the user to frontend /payment/result with the query params.
 */
export const momoCallback = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, string>
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const params = new URLSearchParams(body as Record<string, string>).toString()
    res.redirect(`${clientUrl}/payment/result?${params}`)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xử lý callback MoMo' })
  }
}

/** POST /api/payment/momo/ipn  — MoMo server-to-server notification */
export const momoIPN = async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, string>

    if (!verifyMoMoSignature(body)) {
      res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' })
      return
    }

    const orderId = parseMomoOrderId(body.orderId)
    if (!orderId) {
      res.status(400).json({ success: false, message: 'orderId không hợp lệ' })
      return
    }

    const resultCode = parseInt(body.resultCode)

    if (resultCode === 0) {
      const status = await resolveStatus('paid')
      await updateOrderStatus(orderId, status.status_id, `MoMo IPN — resultCode: ${resultCode}`)
    } else {
      await handlePaymentFailure(orderId, `MoMo IPN — resultCode: ${resultCode}`)
    }

    // MoMo expects HTTP 204 or 200 to confirm receipt
    res.status(204).send()
  } catch (error) {
    console.error('[momoIPN]', error)
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

// ─── VNPay ──────────────────────────────────────────────────────────────────

/** POST /api/payment/vnpay/create  (authenticated) */
export const vnpayCreate = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, amount, orderInfo } = req.body as { orderId: number; amount: number; orderInfo: string }

    if (!orderId || !amount) {
      res.status(400).json({ success: false, message: 'orderId và amount là bắt buộc' })
      return
    }

    const order = await getOrderById(Number(orderId))
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    if (order.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    if (Math.round(Number(amount)) !== Math.round(Number(order.final_amount))) {
      res.status(400).json({ success: false, message: 'Số tiền không khớp với đơn hàng' })
      return
    }

    const ipAddr = getClientIp(req)
    const result = createVNPayPayment(
      Number(orderId),
      Number(amount),
      orderInfo || `Thanh toán đơn hàng #${order.order_code}`,
      ipAddr,
    )

    res.json({ success: result.success, message: result.message, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

/**
 * GET /api/payment/vnpay/return  — VNPay redirects the user browser here after payment.
 * Verify signature then redirect to frontend /payment/result with query params.
 */
export const vnpayReturn = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string>
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    if (!verifyVNPaySignature(query)) {
      res.redirect(`${clientUrl}/payment/result?success=false&message=Chữ+ký+không+hợp+lệ`)
      return
    }

    const orderId = parseVnpayOrderId(query.vnp_TxnRef)
    if (!orderId) {
      res.redirect(`${clientUrl}/payment/result?success=false&message=Đơn+hàng+không+hợp+lệ`)
      return
    }

    const isSuccess = query.vnp_ResponseCode === '00'

    if (isSuccess) {
      const status = await resolveStatus('paid')
      await updateOrderStatus(orderId, status.status_id, `VNPay return — code: ${query.vnp_ResponseCode}`)
    } else {
      await handlePaymentFailure(orderId, `VNPay return — code: ${query.vnp_ResponseCode}`)
    }

    const params = new URLSearchParams({
      success: String(isSuccess),
      method: 'vnpay',
      orderId: String(orderId),
      transactionId: query.vnp_TransactionNo ?? '',
      amount: query.vnp_Amount ?? '',
    }).toString()

    res.redirect(`${clientUrl}/payment/result?${params}`)
  } catch (error) {
    console.error('[vnpayReturn]', error)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    res.redirect(`${clientUrl}/payment/result?success=false&message=Lỗi+server`)
  }
}

/** POST /api/payment/vnpay/ipn  — VNPay server-to-server notification */
export const vnpayIPN = async (req: Request, res: Response) => {
  try {
    const query = req.query as Record<string, string>

    if (!verifyVNPaySignature(query)) {
      res.json({ RspCode: '97', Message: 'Invalid signature' })
      return
    }

    const orderId = parseVnpayOrderId(query.vnp_TxnRef)
    if (!orderId) {
      res.json({ RspCode: '01', Message: 'Order not found' })
      return
    }

    const order = await getOrderById(orderId)
    if (!order) {
      res.json({ RspCode: '01', Message: 'Order not found' })
      return
    }

    const vnpAmount = Math.round(parseInt(query.vnp_Amount))
    if (vnpAmount !== Math.round(Number(order.final_amount) * 100)) {
      res.json({ RspCode: '04', Message: 'Invalid amount' })
      return
    }

    const isSuccess = query.vnp_ResponseCode === '00'

    if (isSuccess) {
      const status = await resolveStatus('paid')
      await updateOrderStatus(orderId, status.status_id, `VNPay IPN — code: ${query.vnp_ResponseCode}`)
    } else {
      await handlePaymentFailure(orderId, `VNPay IPN — code: ${query.vnp_ResponseCode}`)
    }

    // VNPay expects this exact response shape
    res.json({ RspCode: '00', Message: 'Confirm success' })
  } catch (error) {
    console.error('[vnpayIPN]', error)
    res.json({ RspCode: '99', Message: 'Unknown error' })
  }
}

// ─── COD ────────────────────────────────────────────────────────────────────

/** POST /api/payment/cod/confirm  (authenticated) */
export const codConfirm = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body as { orderId: number }

    if (!orderId) {
      res.status(400).json({ success: false, message: 'orderId là bắt buộc' })
      return
    }

    const order = await getOrderById(Number(orderId))
    if (!order) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' })
      return
    }
    if (order.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }

    const status = await resolveStatus('pending_cod')
    await updateOrderStatus(Number(orderId), status.status_id, 'Khách hàng chọn thanh toán COD')

    res.json({
      success: true,
      message: 'Xác nhận COD thành công',
      data: { orderId, status: 'pending_cod' },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
