import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, XCircle } from 'lucide-react'
import api from '../../lib/api'
import type { Order } from '../../types'
import Spinner from '../../components/Spinner'

const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ xử lý',
  confirmed:   'Đã xác nhận',
  shipping:    'Đang giao hàng',
  delivered:   'Đã giao',
  cancelled:   'Đã huỷ',
  paid:        'Đã thanh toán',
  failed:      'Thanh toán thất bại',
  pending_cod: 'Chờ thanh toán COD',
}

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:     { color: '#ffb800', bg: 'rgba(255,184,0,0.12)',  border: 'rgba(255,184,0,0.3)'  },
  confirmed:   { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)', border: 'rgba(0,180,255,0.3)'  },
  shipping:    { color: '#00e5ff', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.3)'  },
  delivered:   { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  cancelled:   { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  paid:        { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  failed:      { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  pending_cod: { color: '#ffb800', bg: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)'  },
}
const fallbackStatus = { color: '#6b6b8a', bg: 'rgba(107,107,138,0.12)', border: 'rgba(107,107,138,0.3)' }

// Fixed pipeline order for timeline
const PIPELINE = ['pending', 'confirmed', 'shipping', 'delivered']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const load = () =>
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.data)).catch(() => navigate('/orders'))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!confirm('Bạn chắc chắn muốn huỷ đơn hàng?')) return
    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`)
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Huỷ thất bại')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!order) return null

  const statusName = order.order_status?.name ?? ''
  const isCancelled = statusName === 'cancelled' || statusName === 'refunded'
  const statusStyle = statusColors[statusName] ?? fallbackStatus

  // Build timeline: use history if available, otherwise synthesize from pipeline
  const history = order.order_status_history ? [...order.order_status_history].reverse() : []

  // Determine pipeline progress index
  const pipelineIdx = PIPELINE.indexOf(statusName)

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">{order.order_code}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {new Date(order.created_at!).toLocaleString('vi-VN')}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-semibold shrink-0" style={{ color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
          {STATUS_LABELS[statusName] ?? statusName}
        </span>
      </div>

      <div className="space-y-4">

        {/* Status timeline */}
        <div className="card p-5">
          <h2 className="font-bold mb-4">Trạng thái đơn hàng</h2>

          {isCancelled ? (
            /* Cancelled state */
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.2)' }}>
              <XCircle size={24} style={{ color: 'var(--error)', flexShrink: 0 }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--error)' }}>{STATUS_LABELS[statusName] ?? statusName}</p>
                {history.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {new Date(history[history.length - 1].changed_at).toLocaleString('vi-VN')}
                    {history[history.length - 1].note && ` — ${history[history.length - 1].note}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Progress pipeline */
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-5 right-5 h-0.5" style={{ background: 'var(--border)', zIndex: 0 }} />
              <div
                className="absolute top-5 left-5 h-0.5 transition-all duration-500"
                style={{
                  width: pipelineIdx <= 0 ? '0%' : `${(pipelineIdx / (PIPELINE.length - 1)) * 100}%`,
                  background: 'var(--neon-blue)',
                  zIndex: 1,
                  maxWidth: 'calc(100% - 40px)',
                }}
              />
              <div className="flex justify-between relative" style={{ zIndex: 2 }}>
                {PIPELINE.map((step, idx) => {
                  const done = pipelineIdx >= idx
                  const active = pipelineIdx === idx
                  const stepHistory = history.find((h) => h.order_status?.name === step)
                  return (
                    <div key={step} className="flex flex-col items-center gap-2" style={{ width: `${100 / PIPELINE.length}%` }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                          background: done ? 'var(--neon-blue)' : 'var(--surface-raised)',
                          border: `2px solid ${done ? 'var(--neon-blue)' : 'var(--border)'}`,
                          boxShadow: active ? '0 0 12px rgba(0,180,255,0.5)' : 'none',
                        }}
                      >
                        {done
                          ? <CheckCircle size={20} color="#fff" />
                          : <Circle size={20} style={{ color: 'var(--muted)' }} />}
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-semibold" style={{ color: done ? 'var(--text)' : 'var(--muted)' }}>
                          {STATUS_LABELS[step]}
                        </p>
                        {stepHistory && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                            {new Date(stepHistory.changed_at).toLocaleDateString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* History log */}
          {history.length > 0 && (
            <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Lịch sử cập nhật</p>
              {history.map((h) => (
                <div key={h.history_id} className="flex items-start gap-3 text-xs">
                  <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full" style={{ background: 'var(--neon-blue)', marginTop: 5 }} />
                  <div className="flex-1">
                    <span className="font-medium">{STATUS_LABELS[h.order_status?.name ?? ''] ?? h.order_status?.name}</span>
                    {h.note && <span style={{ color: 'var(--muted)' }}> — {h.note}</span>}
                  </div>
                  <span className="shrink-0" style={{ color: 'var(--muted)' }}>
                    {new Date(h.changed_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        <div className="card p-4">
          <h2 className="font-bold mb-3">Sản phẩm</h2>
          <div className="space-y-3">
            {order.order_details.map((d) => (
              <div key={d.order_detail_id} className="flex justify-between text-sm gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{d.product_name}</p>
                  {d.variant_info && <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.variant_info}</p>}
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>x{d.quantity} · {Number(d.price).toLocaleString('vi-VN')}₫/sp</p>
                </div>
                <p className="font-semibold shrink-0">{(Number(d.price) * d.quantity).toLocaleString('vi-VN')}₫</p>
              </div>
            ))}
          </div>
        </div>

        {/* Price summary */}
        <div className="card p-4 text-sm space-y-2">
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Tạm tính</span><span>{Number(order.total_amount).toLocaleString('vi-VN')}₫</span></div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between" style={{ color: 'var(--success)' }}><span>Giảm giá</span><span>-{Number(order.discount_amount).toLocaleString('vi-VN')}₫</span></div>
          )}
          <div className="flex justify-between"><span style={{ color: 'var(--muted)' }}>Phí vận chuyển</span><span>{Number(order.shipping_fee).toLocaleString('vi-VN')}₫</span></div>
          <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Tổng cộng</span><span className="neon-text">{Number(order.final_amount).toLocaleString('vi-VN')}₫</span>
          </div>
        </div>

        {/* Shipping info */}
        <div className="card p-4 text-sm space-y-2">
          <h2 className="font-bold">Thông tin giao hàng</h2>
          <p style={{ color: 'var(--muted)', whiteSpace: 'pre-line' }}>{order.shipping_address}</p>
          {order.payment_method && (
            <p style={{ color: 'var(--muted)' }}>
              Thanh toán: <span style={{ color: 'var(--text)' }}>
                {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)'
                  : order.payment_method === 'bank_transfer' ? 'Chuyển khoản ngân hàng'
                  : order.payment_method === 'vnpay' ? 'VNPay'
                  : order.payment_method === 'momo' ? 'Ví MoMo'
                  : order.payment_method}
              </span>
            </p>
          )}
          {order.note && <p style={{ color: 'var(--muted)' }}>Ghi chú: <span style={{ color: 'var(--text)' }}>{order.note}</span></p>}
        </div>

        {/* Cancel button */}
        {statusName === 'pending' && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.3)', cursor: 'pointer' }}
          >
            {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
          </button>
        )}
      </div>
    </div>
  )
}
