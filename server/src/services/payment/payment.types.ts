export type PaymentMethod = 'momo' | 'vnpay' | 'cod'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'pending_cod'

export interface CreatePaymentDto {
  orderId: number
  amount: number
  orderInfo: string
  method: PaymentMethod
}

export interface PaymentResult {
  success: boolean
  message: string
  redirectUrl?: string
  transactionId?: string
}
