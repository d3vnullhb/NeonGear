import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, ArrowRight, ShoppingBag } from 'lucide-react'

export default function PaymentResult() {
  const [params] = useSearchParams()

  // Detect method and parse result
  const method = params.get('method') // 'vnpay' set by our backend
  const resultCode = params.get('resultCode') // MoMo: '0' = success

  let isSuccess: boolean
  let orderId: number | null = null
  let transactionId: string | null = null
  let displayMethod: string

  if (method === 'vnpay') {
    isSuccess = params.get('success') === 'true'
    orderId = parseInt(params.get('orderId') ?? '0') || null
    transactionId = params.get('transactionId')
    displayMethod = 'VNPay'
  } else if (resultCode !== null) {
    // MoMo callback params
    isSuccess = resultCode === '0'
    const momoOrderId = params.get('orderId') ?? ''
    // format: NEONGEAR_<id>_<ts>
    const parts = momoOrderId.split('_')
    orderId = parts.length >= 3 ? (parseInt(parts[1]) || null) : null
    transactionId = params.get('transId')
    displayMethod = 'MoMo'
  } else {
    // Fallback for unknown redirects
    isSuccess = params.get('success') === 'true'
    orderId = parseInt(params.get('orderId') ?? '0') || null
    displayMethod = 'Thanh toán'
  }

  return (
    <div className="flex items-center justify-center px-4 py-16" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8 text-center space-y-5">

          {/* Icon */}
          <div className="flex justify-center">
            {isSuccess
              ? <CheckCircle size={64} style={{ color: 'var(--success)', filter: 'drop-shadow(0 0 16px rgba(0,255,157,0.5))' }} />
              : <XCircle size={64} style={{ color: 'var(--error)', filter: 'drop-shadow(0 0 16px rgba(255,77,106,0.5))' }} />
            }
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
              {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {isSuccess
                ? `Đơn hàng của bạn đã được thanh toán qua ${displayMethod} và đang được xử lý.`
                : `Giao dịch ${displayMethod} không thành công. Vui lòng thử lại hoặc chọn phương thức khác.`}
            </p>
          </div>

          {/* Details */}
          {isSuccess && (orderId || transactionId) && (
            <div className="rounded-xl p-4 text-left space-y-2" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              {orderId && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Mã đơn hàng</span>
                  <span className="font-semibold">#{orderId}</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--muted)' }}>Mã giao dịch</span>
                  <span className="font-semibold text-xs break-all">{transactionId}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--muted)' }}>Phương thức</span>
                <span className="font-semibold" style={{ color: 'var(--neon-blue)' }}>{displayMethod}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            {isSuccess && orderId ? (
              <Link
                to={`/orders/${orderId}`}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                Xem đơn hàng <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                to={orderId ? `/orders/${orderId}` : '/orders'}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                Xem đơn hàng <ArrowRight size={16} />
              </Link>
            )}
            <Link
              to="/products"
              className="btn-ghost w-full py-3 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={16} /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
