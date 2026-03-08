import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Order, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const statusColors: Record<string, string> = {
  pending: 'var(--warning)',
  processing: 'var(--neon-blue)',
  shipped: 'var(--neon-cyan)',
  delivered: 'var(--success)',
  cancelled: 'var(--error)',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [orderStatuses, setOrderStatuses] = useState<{ status_id: number; name: string }[]>([])

  useEffect(() => {
    api.get('/orders/statuses').then((res) => setOrderStatuses(res.data.data ?? []))
  }, [])

  const fetchOrders = () => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page), limit: '20' })
    if (statusFilter) {
      const s = orderStatuses.find((s) => s.name === statusFilter)
      if (s) q.set('status_id', String(s.status_id))
    }
    api.get(`/admin/orders?${q}`).then((res) => {
      setOrders(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [page, statusFilter])

  const updateStatus = async (orderId: number, statusName: string) => {
    const status = orderStatuses.find((s) => s.name === statusName)
    if (!status) return
    await api.put(`/admin/orders/${orderId}/status`, { status_id: status.status_id })
    fetchOrders()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Đơn hàng</h1>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="input-inset text-sm w-40" style={{ width: 'auto' }}>
          <option value="">Tất cả</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o.order_id}`} className="font-mono text-xs" style={{ color: 'var(--neon-blue)' }}>{o.order_code}</Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{(o as any).users?.full_name ?? 'N/A'}</td>
                    <td className="px-4 py-3 font-semibold">{Number(o.final_amount).toLocaleString('vi-VN')}₫</td>
                    <td className="px-4 py-3">
                      <select
                        value={o.order_status?.name ?? ''}
                        onChange={(e) => updateStatus(o.order_id, e.target.value)}
                        className="text-xs py-1 px-2 rounded"
                        style={{ background: 'var(--surface-raised)', border: `1px solid ${statusColors[o.order_status?.name ?? ''] || 'var(--border)'}`, color: statusColors[o.order_status?.name ?? ''] || 'var(--text)', cursor: 'pointer' }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o.order_id}`} className="text-xs btn-ghost py-1 px-2">Chi tiết</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary py-1 px-3 text-sm' : 'btn-ghost py-1 px-3 text-sm'}>{p}</button>
          ))}
        </div>
      )}
    </div>
  )
}
