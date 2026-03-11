import crypto from 'crypto'
import axios from 'axios'
import { PaymentResult } from './payment.types'

const MOMO = {
  partnerCode: process.env.MOMO_PARTNER_CODE as string,
  accessKey:   process.env.MOMO_ACCESS_KEY   as string,
  secretKey:   process.env.MOMO_SECRET_KEY   as string,
  sandboxUrl:  process.env.MOMO_SANDBOX_URL  as string,
  redirectUrl: process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/payment/result` : 'http://localhost:5173/payment/result',
  ipnUrl:      process.env.SERVER_URL ? `${process.env.SERVER_URL}/api/payment/momo/ipn` : 'http://localhost:3000/api/payment/momo/ipn',
}

function hmac256(data: string): string {
  return crypto.createHmac('sha256', MOMO.secretKey).update(data).digest('hex')
}

/** Build the orderId we send to MoMo so we can parse back the real orderId on callback */
export function buildMomoOrderId(orderId: number): string {
  return `NEONGEAR_${orderId}_${Date.now()}`
}

/** Extract the app orderId from MoMo's returned orderId field */
export function parseMomoOrderId(momoOrderId: string): number | null {
  const parts = momoOrderId.split('_')
  // format: NEONGEAR_<orderId>_<ts>
  if (parts.length < 3) return null
  const id = parseInt(parts[1])
  return isNaN(id) ? null : id
}

export async function createMoMoPayment(
  orderId: number,
  amount: number,
  orderInfo: string,
): Promise<PaymentResult> {
  try {
    const requestId   = `${MOMO.partnerCode}${Date.now()}`
    const momoOrderId = buildMomoOrderId(orderId)
    const extraData   = ''
    const requestType = 'captureWallet'

    const amt = Math.round(amount) // MoMo requires integer VND amount

    // Keys must be in alphabetical order
    const rawSignature = [
      `accessKey=${MOMO.accessKey}`,
      `amount=${amt}`,
      `extraData=${extraData}`,
      `ipnUrl=${MOMO.ipnUrl}`,
      `orderId=${momoOrderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${MOMO.partnerCode}`,
      `redirectUrl=${MOMO.redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&')

    const signature = hmac256(rawSignature)

    const body = {
      partnerCode: MOMO.partnerCode,
      accessKey:   MOMO.accessKey,
      requestId,
      amount: amt,
      orderId:     momoOrderId,
      orderInfo,
      redirectUrl: MOMO.redirectUrl,
      ipnUrl:      MOMO.ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    }

    const { data } = await axios.post(MOMO.sandboxUrl, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10_000,
    })

    if (data.resultCode === 0) {
      return {
        success: true,
        message: 'Tạo thanh toán MoMo thành công',
        redirectUrl: data.payUrl,
        transactionId: requestId,
      }
    }

    return { success: false, message: data.message || 'Tạo thanh toán MoMo thất bại' }
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.message ?? error?.message ?? 'Lỗi kết nối MoMo' }
  }
}

/** Verify signature from MoMo IPN / callback notification */
export function verifyMoMoSignature(body: Record<string, string>): boolean {
  const rawSignature = [
    `accessKey=${MOMO.accessKey}`,
    `amount=${body.amount}`,
    `extraData=${body.extraData}`,
    `message=${body.message}`,
    `orderId=${body.orderId}`,
    `orderInfo=${body.orderInfo}`,
    `orderType=${body.orderType}`,
    `partnerCode=${body.partnerCode}`,
    `payType=${body.payType}`,
    `requestId=${body.requestId}`,
    `responseTime=${body.responseTime}`,
    `resultCode=${body.resultCode}`,
    `transId=${body.transId}`,
  ].join('&')

  const expected = hmac256(rawSignature)
  return expected === body.signature
}
