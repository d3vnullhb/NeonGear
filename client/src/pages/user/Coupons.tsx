import { useEffect, useState } from 'react'
import { Tag, Copy, Check, Clock, ShoppingBag, Percent, Zap } from 'lucide-react'
import api from '../../lib/api'

interface Coupon {
  coupon_id: number
  code: string
  discount_type: string | null
  discount_value: string | null
  min_order_amount: string | null
  max_discount_amount: string | null
  expiry_date: string | null
  usage_limit: number | null
  used_count: number | null
  per_user_limit: number | null
}

function formatMoney(val: string | null) {
  if (!val) return null
  const n = parseFloat(val)
  if (isNaN(n)) return null
  return n.toLocaleString('vi-VN') + '₫'
}

function daysLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    api.get('/coupons').then(r => {
      setCoupons(r.data.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  function handleCopy(coupon: Coupon) {
    navigator.clipboard.writeText(coupon.code)
    setCopied(coupon.coupon_id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Zap size={28} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
        <h1 className="text-3xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>Mã Giảm Giá</h1>
      </div>
      <p className="mb-8 text-sm" style={{ color: 'var(--muted)' }}>
        Sao chép mã và áp dụng khi thanh toán để nhận ưu đãi.
      </p>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse" style={{ height: 130 }} />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16" style={{ color: 'var(--muted)' }}>
          <Tag size={40} />
          <p className="font-medium">Hiện chưa có mã giảm giá nào.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map(coupon => {
            const isPercent = coupon.discount_type === 'percent'
            const days = coupon.expiry_date ? daysLeft(coupon.expiry_date) : null
            const remaining = coupon.usage_limit != null && coupon.used_count != null
              ? coupon.usage_limit - coupon.used_count
              : null

            return (
              <div
                key={coupon.coupon_id}
                className="card-raised overflow-hidden"
                style={{ borderLeft: '3px solid var(--neon-blue)', padding: 0 }}
              >
                {/* Top stripe */}
                <div
                  style={{
                    background: 'linear-gradient(135deg,rgba(0,180,255,0.12),rgba(0,229,255,0.05))',
                    padding: '1rem 1.25rem 0.75rem',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Code */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag size={15} style={{ color: 'var(--neon-blue)', shrink: 0 }} />
                      <span
                        className="font-bold tracking-widest text-sm truncate"
                        style={{ fontFamily: 'Space Grotesk', color: 'var(--neon-blue)' }}
                      >
                        {coupon.code}
                      </span>
                    </div>
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(coupon)}
                      className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: copied === coupon.coupon_id ? 'rgba(0,255,157,0.15)' : 'var(--surface-raised)',
                        border: `1px solid ${copied === coupon.coupon_id ? 'var(--success)' : 'var(--border)'}`,
                        color: copied === coupon.coupon_id ? 'var(--success)' : 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      {copied === coupon.coupon_id ? <Check size={13} /> : <Copy size={13} />}
                      {copied === coupon.coupon_id ? 'Đã sao chép' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Discount value */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {isPercent ? <Percent size={14} style={{ color: 'var(--neon-cyan)' }} /> : <Zap size={14} style={{ color: 'var(--warning)' }} />}
                    <span className="font-bold text-base" style={{ color: isPercent ? 'var(--neon-cyan)' : 'var(--warning)' }}>
                      {isPercent
                        ? `Giảm ${coupon.discount_value}%`
                        : `Giảm ${formatMoney(coupon.discount_value)}`}
                    </span>
                    {isPercent && coupon.max_discount_amount && (
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        (tối đa {formatMoney(coupon.max_discount_amount)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>
                  {coupon.min_order_amount && parseFloat(coupon.min_order_amount) > 0 && (
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={12} />
                      Đơn tối thiểu {formatMoney(coupon.min_order_amount)}
                    </span>
                  )}
                  {days !== null && (
                    <span
                      className="flex items-center gap-1"
                      style={{ color: days <= 3 ? 'var(--error)' : days <= 7 ? 'var(--warning)' : 'var(--muted)' }}
                    >
                      <Clock size={12} />
                      {days > 0 ? `Còn ${days} ngày` : 'Hết hạn hôm nay'}
                    </span>
                  )}
                  {remaining !== null && (
                    <span className="flex items-center gap-1" style={{ color: remaining <= 5 ? 'var(--error)' : 'var(--muted)' }}>
                      <Tag size={12} />
                      Còn {remaining} lượt
                    </span>
                  )}
                  {coupon.per_user_limit && (
                    <span>Mỗi người dùng {coupon.per_user_limit} lần</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
