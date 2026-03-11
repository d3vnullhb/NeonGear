import crypto from 'crypto'
import { PaymentResult } from './payment.types'

const VNPAY = {
  vnp_TmnCode:    process.env.VNPAY_TMN_CODE    as string,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET as string,
  vnp_Url:        process.env.VNPAY_URL         as string,
  vnp_Version:    '2.1.0',
  vnp_Command:    'pay',
  vnp_CurrCode:   'VND',
  vnp_Locale:     'vn',
  vnp_ReturnUrl:  process.env.SERVER_URL
    ? `${process.env.SERVER_URL}/api/payment/vnpay/return`
    : 'http://localhost:3000/api/payment/vnpay/return',
}

function hmac512(data: string): string {
  return crypto.createHmac('sha512', VNPAY.vnp_HashSecret).update(data).digest('hex')
}

function sortObject(obj: Record<string, any>): Record<string, any> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, any>>((acc, key) => { acc[key] = obj[key]; return acc }, {})
}

function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

function toUnsignedQueryString(params: Record<string, any>): string {
  // VNPay signature is computed WITHOUT URL encoding
  return Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
}

/**
 * VNPay requires vnp_OrderInfo to contain only ASCII characters (no diacritics).
 * This converts Vietnamese diacritics to their ASCII equivalents.
 */
function toAsciiOrderInfo(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s\-_.]/g, '') // keep safe chars only
    .trim()
    .slice(0, 255)
}

/** Build the txnRef we send to VNPay so we can parse back the real orderId on return */
export function buildVnpayTxnRef(orderId: number): string {
  return `${orderId}_${Date.now()}`
}

/** Extract the app orderId from VNPay's vnp_TxnRef */
export function parseVnpayOrderId(txnRef: string): number | null {
  const id = parseInt(txnRef.split('_')[0])
  return isNaN(id) ? null : id
}

export function createVNPayPayment(
  orderId: number,
  amount: number,
  orderInfo: string,
  ipAddr: string,
): PaymentResult {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const createDate = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('')

  const txnRef = buildVnpayTxnRef(orderId)

  const vnp_Params: Record<string, any> = {
    vnp_Version:   VNPAY.vnp_Version,
    vnp_Command:   VNPAY.vnp_Command,
    vnp_TmnCode:   VNPAY.vnp_TmnCode,
    vnp_Locale:    VNPAY.vnp_Locale,
    vnp_CurrCode:  VNPAY.vnp_CurrCode,
    vnp_TxnRef:    txnRef,
    vnp_OrderInfo: toAsciiOrderInfo(orderInfo), // VNPay requires ASCII only
    vnp_OrderType: 'other',
    vnp_Amount:    Math.round(amount) * 100, // VNPay requires integer VND × 100
    vnp_ReturnUrl: VNPAY.vnp_ReturnUrl,
    vnp_IpAddr:    ipAddr,
    vnp_CreateDate: createDate,
  }

  const sorted = sortObject(vnp_Params)
  const signData = toUnsignedQueryString(sorted)
  const signature = hmac512(signData)

  sorted.vnp_SecureHash = signature
  const redirectUrl = `${VNPAY.vnp_Url}?${toQueryString(sorted)}`

  return {
    success: true,
    message: 'Tạo thanh toán VNPay thành công',
    redirectUrl,
    transactionId: txnRef,
  }
}

/** Verify signature from VNPay return / IPN */
export function verifyVNPaySignature(query: Record<string, string>): boolean {
  const { vnp_SecureHash, vnp_SecureHashType, ...params } = query
  const sorted = sortObject(params)
  const signData = toUnsignedQueryString(sorted)
  const expected = hmac512(signData)
  return expected === vnp_SecureHash
}
