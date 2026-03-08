import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import api from '../lib/api'
import type { Order, Pagination } from '../types'
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get(`/orders?page=${page}`).then((res) => {
      setOrders(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }, [page])

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>

  if (!orders.length) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <Package size={64} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
      <h2 className="text-2xl font-bold mb-2">Chưa có đơn hàng</h2>
      <Link to="/products" className="btn-primary inline-flex mt-4">Mua sắm ngay</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.order_id} to={`/orders/${order.order_id}`} className="card p-4 block hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-sm">{order.order_code}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>{new Date(order.created_at!).toLocaleDateString('vi-VN')}</span>
              </div>
              {(() => { const s = statusColors[order.order_status?.name ?? ''] ?? fallbackStatus; return (
                <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {STATUS_LABELS[order.order_status?.name ?? ''] ?? order.order_status?.name ?? 'N/A'}
                </span>
              ) })()}
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {order.order_details.slice(0, 2).map((d) => d.product_name).join(', ')}
              {order.order_details.length > 2 && ` +${order.order_details.length - 2} sản phẩm`}
            </div>
            <div className="text-right font-bold mt-2 neon-text">{Number(order.final_amount).toLocaleString('vi-VN')}₫</div>
          </Link>
        ))}
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
