export const SHIPPING_FREE_THRESHOLD = 500000
export const SHIPPING_STANDARD = 30000
export const SHIPPING_EXPRESS = 50000

export function calcShippingFee(subtotal: number, method: string): number {
  if (method === 'express') return SHIPPING_EXPRESS
  return subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_STANDARD
}
