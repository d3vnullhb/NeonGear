import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, X } from 'lucide-react'
import api from '../../lib/api'
import type { Order, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

const HIDDEN_KEY = 'ng_hidden_orders'
const loadHidden = (): Set<number> => {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? '[]')) } catch { return new Set() }
}
const saveHidden = (set: Set<number>) => localStorage.setItem(HIDDEN_KEY, JSON.stringify([...set]))

const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ xử lý',
  processing:  'Đang xử lý',
  confirmed:   'Đã xác nhận',
  shipping:    'Đang giao hàng',
  delivered:   'Đã giao',
  completed:   'Hoàn thành',
  cancelled:   'Đã huỷ',
  refunded:    'Đã hoàn tiền',
  paid:        'Đã thanh toán',
  failed:      'Thanh toán thất bại',
  pending_cod: 'Chờ thanh toán COD',
}

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:     { color: '#ffb800', bg: 'rgba(255,184,0,0.12)',  border: 'rgba(255,184,0,0.3)'  },
  processing:  { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)', border: 'rgba(0,180,255,0.3)'  },
  confirmed:   { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)', border: 'rgba(0,180,255,0.3)'  },
  shipping:    { color: '#00e5ff', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.3)'  },
  delivered:   { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  completed:   { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  cancelled:   { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  refunded:    { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  paid:        { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  failed:      { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  pending_cod: { color: '#ffb800', bg: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)'  },
}
const fallbackStatus = { color: '#6b6b8a', bg: 'rgba(107,107,138,0.12)', border: 'rgba(107,107,138,0.3)' }

const DISMISSABLE = new Set(['delivered', 'completed', 'cancelled', 'refunded'])

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hidden, setHidden] = useState<Set<number>>(() => loadHidden())

  const dismiss = (e: React.MouseEvent, orderId: number) => {
    e.preventDefault()
    e.stopPropagation()
    setHidden(prev => {
      const next = new Set(prev)
      next.add(orderId)
      saveHidden(next)
      return next
    })
  }

  useEffect(() => {
    setLoading(true)
    api.get(`/orders?page=${page}`).then((res) => {
      setOrders(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }, [page])

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>

  if (!orders.length) return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
      <Package size={64} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
      <h2 className="text-2xl font-bold mb-2">Chưa có đơn hàng</h2>
      <Link to="/products" className="btn-primary inline-flex mt-4">Mua sắm ngay</Link>
    </div>
  )

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      <div className="space-y-4">
        {orders.filter(o => !hidden.has(o.order_id)).map((order) => {
          const statusName = order.order_status?.name ?? ''
          const canDismiss = DISMISSABLE.has(statusName)
          return (
          <Link key={order.order_id} to={`/orders/${order.order_id}`} className="card p-4 block hover:-translate-y-0.5 transition-transform" style={{ position: 'relative' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-sm">{order.order_code}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{new Date(order.created_at!).toLocaleDateString('vi-VN')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(() => { const s = statusColors[statusName] ?? fallbackStatus; return (
                  <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                    {STATUS_LABELS[statusName] ?? statusName ?? 'N/A'}
                  </span>
                ) })()}
                {canDismiss && (
                  <button
                    onClick={e => dismiss(e, order.order_id)}
                    title="Ẩn đơn hàng này"
                    style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(107,107,138,0.15)', border: '1px solid rgba(107,107,138,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0, transition: 'background 150ms, color 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = '#ff4d6a' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,107,138,0.15)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {order.order_details.slice(0, 2).map((d) => d.product_name).join(', ')}
              {order.order_details.length > 2 && ` +${order.order_details.length - 2} sản phẩm`}
            </div>
            <div className="text-right font-bold mt-2 neon-text">{Number(order.final_amount).toLocaleString('vi-VN')}₫</div>
          </Link>
          )
        })}
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary py-2 px-4' : 'btn-ghost py-2 px-4'}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
