import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import type { Order } from '../types'
import Spinner from '../components/Spinner'

const STATUS_LABELS: Record<string, string> = {
  pending:   'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping:  'Đang giao hàng',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:    { color: '#ffb800', bg: 'rgba(255,184,0,0.12)',   border: 'rgba(255,184,0,0.3)' },
  confirmed:  { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)',   border: 'rgba(0,180,255,0.3)' },
  shipping:   { color: '#00e5ff', bg: 'rgba(0,229,255,0.12)',   border: 'rgba(0,229,255,0.3)' },
  delivered:  { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)',   border: 'rgba(0,255,157,0.3)' },
  cancelled:  { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)', border: 'rgba(255,77,106,0.3)' },
}
const fallbackStatus = { color: '#6b6b8a', bg: 'rgba(107,107,138,0.12)', border: 'rgba(107,107,138,0.3)' }

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.data)).catch(() => navigate('/orders')).finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Bạn chắc chắn muốn huỷ đơn hàng?')) return
    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`)
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.data)
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Huỷ thất bại')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!order) return null

  const statusName = order.order_status?.name ?? ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{order.order_code}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{new Date(order.created_at!).toLocaleString('vi-VN')}</p>
        </div>
        {(() => { const s = statusColors[statusName] ?? fallbackStatus; return (
          <span className="px-3 py-1 rounded-full text-sm font-semibold" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
            {STATUS_LABELS[statusName] ?? statusName}
          </span>
        ) })()}
      </div>

      <div className="space-y-4">
        {/* Items */}
        <div className="card p-4">
          <h2 className="font-bold mb-3">Sản phẩm</h2>
          <div className="space-y-3">
            {order.order_details.map((d) => (
              <div key={d.order_detail_id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{d.product_name}</p>
                  {d.variant_info && <p style={{ color: 'var(--muted)' }}>{d.variant_info}</p>}
                  <p style={{ color: 'var(--muted)' }}>x{d.quantity}</p>
                </div>
                <p className="font-semibold">{(Number(d.price) * d.quantity).toLocaleString('vi-VN')}₫</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card p-4 text-sm space-y-2">
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Tạm tính</span><span>{Number(order.total_amount).toLocaleString('vi-VN')}₫</span></div>
          {Number(order.discount_amount) > 0 && <div className="flex justify-between" style={{ color: 'var(--success)' }}><span>Giảm giá</span><span>-{Number(order.discount_amount).toLocaleString('vi-VN')}₫</span></div>}
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Phí ship</span><span>{Number(order.shipping_fee).toLocaleString('vi-VN')}₫</span></div>
          <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Tổng cộng</span><span className="neon-text">{Number(order.final_amount).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="card p-4 text-sm">
          <h2 className="font-bold mb-2">Địa chỉ giao hàng</h2>
          <p style={{ color: 'var(--muted)' }}>{order.shipping_address}</p>
          {order.payment_method && <p className="mt-1" style={{ color: 'var(--muted)' }}>Thanh toán: {order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</p>}
        </div>

        {statusName === 'pending' && (
          <button onClick={handleCancel} disabled={cancelling} className="w-full py-3 rounded-lg text-sm font-semibold transition-colors" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.3)', cursor: 'pointer' }}>
            {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
          </button>
        )}
      </div>
    </div>
  )
}
