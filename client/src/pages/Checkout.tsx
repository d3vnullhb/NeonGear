import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Checkout() {
  const { cart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    shipping_address: user?.address ?? '',
    shipping_method: 'standard',
    payment_method: 'cod',
    note: '',
    coupon_code: '',
  })
  const [couponInfo, setCouponInfo] = useState<{ discount_amount: number; coupon: any } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = cart?.cart_items.reduce((sum, item) => sum + Number(item.product_variants?.price ?? 0) * item.quantity, 0) ?? 0
  const discount = couponInfo?.discount_amount ?? 0
  const shipping = 30000
  const final = Math.max(0, total - discount + shipping)

  const validateCoupon = async () => {
    if (!form.coupon_code.trim()) { setError('Vui lòng nhập mã giảm giá'); return }
    setError('')
    try {
      const { data } = await api.post('/coupons/validate', { code: form.coupon_code, order_amount: total })
      setCouponInfo(data.data)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Mã không hợp lệ')
      setCouponInfo(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.shipping_address.trim()) { setError('Vui lòng nhập địa chỉ giao hàng'); return }
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/orders', { ...form, coupon_code: couponInfo ? form.coupon_code : undefined })
      await fetchCart()
      navigate(`/orders/${data.data.order_id}`)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  if (!cart || !cart.cart_items.length) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p style={{ color: 'var(--muted)' }}>Giỏ hàng trống</p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6 space-y-4">
            <h2 className="font-bold">Thông tin giao hàng</h2>

            <div>
              <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng *</label>
              <textarea value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} className="input-inset" rows={3} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phương thức giao hàng</label>
              <div className="space-y-2">
                {[{ value: 'standard', label: 'Giao hàng tiêu chuẩn (3-5 ngày)' }, { value: 'express', label: 'Giao hàng nhanh (1-2 ngày)' }].map((m) => (
                  <label key={m.value} className="flex items-center gap-3 card-raised p-3 cursor-pointer">
                    <input type="radio" value={m.value} checked={form.shipping_method === m.value} onChange={(e) => setForm({ ...form, shipping_method: e.target.value })} style={{ accentColor: 'var(--neon-blue)' }} />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
              <div className="space-y-2">
                {[{ value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' }, { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' }].map((m) => (
                  <label key={m.value} className="flex items-center gap-3 card-raised p-3 cursor-pointer">
                    <input type="radio" value={m.value} checked={form.payment_method === m.value} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} style={{ accentColor: 'var(--neon-blue)' }} />
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Ghi chú</label>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-inset" rows={2} placeholder="Ghi chú về đơn hàng..." />
            </div>
          </div>

          {/* Coupon */}
          <div className="card p-4 flex gap-2">
            <input type="text" value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} className="input-inset text-sm" placeholder="Nhập mã giảm giá" />
            <button type="button" onClick={validateCoupon} className="btn-ghost shrink-0 py-2 px-4 text-sm">Áp dụng</button>
          </div>
          {couponInfo && <p className="text-sm" style={{ color: 'var(--success)' }}>Giảm {couponInfo.discount_amount.toLocaleString('vi-VN')}₫</p>}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="font-bold mb-4">Đơn hàng ({cart.cart_items.length} sản phẩm)</h2>
          <div className="space-y-2 text-sm mb-4">
            {cart.cart_items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span style={{ color: 'var(--muted)' }} className="truncate mr-2">{item.product_variants?.products?.name} x{item.quantity}</span>
                <span className="shrink-0">{(Number(item.product_variants?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}₫</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Tạm tính</span><span>{total.toLocaleString('vi-VN')}₫</span></div>
            {discount > 0 && <div className="flex justify-between" style={{ color: 'var(--success)' }}><span>Giảm giá</span><span>-{discount.toLocaleString('vi-VN')}₫</span></div>}
            <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Phí ship</span><span>{shipping.toLocaleString('vi-VN')}₫</span></div>
            <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <span>Tổng</span><span className="neon-text">{final.toLocaleString('vi-VN')}₫</span>
            </div>
          </div>

          {error && <p className="text-sm mt-3" style={{ color: 'var(--error)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4">
            {loading ? 'Đang đặt hàng...' : 'Đặt hàng'}
          </button>
        </div>
      </form>
    </div>
  )
}
