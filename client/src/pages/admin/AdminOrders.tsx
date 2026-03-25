import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import type { Order, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

// These must match the `name` column in the order_status table (seeded values)
const STATUS_OPTIONS = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']

// Valid forward-only transitions per status
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending:   ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'shipping', 'cancelled'],
  shipping:  ['shipping', 'delivered', 'cancelled'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
}
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:     { bg: 'rgba(255,184,0,0.12)',  color: 'var(--warning)',   border: 'rgba(255,184,0,0.3)'  },
  confirmed:   { bg: 'rgba(0,180,255,0.12)',  color: 'var(--neon-blue)', border: 'rgba(0,180,255,0.3)'  },
  shipping:    { bg: 'rgba(0,229,255,0.12)',  color: 'var(--neon-cyan)', border: 'rgba(0,229,255,0.3)'  },
  delivered:   { bg: 'rgba(0,255,157,0.12)',  color: 'var(--success)',   border: 'rgba(0,255,157,0.3)'  },
  cancelled:   { bg: 'rgba(255,77,106,0.12)', color: 'var(--error)',     border: 'rgba(255,77,106,0.3)' },
  paid:        { bg: 'rgba(0,255,157,0.12)',  color: 'var(--success)',   border: 'rgba(0,255,157,0.3)'  },
  failed:      { bg: 'rgba(255,77,106,0.12)', color: 'var(--error)',     border: 'rgba(255,77,106,0.3)' },
  pending_cod: { bg: 'rgba(255,184,0,0.12)',  color: 'var(--warning)',   border: 'rgba(255,184,0,0.3)'  },
}
const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ xử lý',
  confirmed:   'Đã xác nhận',
  shipping:    'Đang giao',
  delivered:   'Đã giao',
  cancelled:   'Đã huỷ',
  paid:        'Đã thanh toán',
  failed:      'Thanh toán lỗi',
  pending_cod: 'Chờ COD',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [orderStatuses, setOrderStatuses] = useState<{ status_id: number; name: string }[]>([])
  const [confirmDelete, setConfirmDelete] = useState<{ order_id: number; order_code: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const updateStatus = async (orderId: number, statusName: string, currentStatus?: string) => {
    if (currentStatus === 'paid' && statusName === 'cancelled') {
      const ok = window.confirm('Đơn hàng này đã được thanh toán.\nBạn cần hoàn tiền thủ công cho khách hàng sau khi huỷ.\n\nTiếp tục huỷ đơn?')
      if (!ok) return
    }
    const status = orderStatuses.find((s) => s.name === statusName)
    if (!status) return
    await api.put(`/admin/orders/${orderId}/status`, { status_id: status.status_id })
    fetchOrders()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/admin/orders/${confirmDelete.order_id}`)
      setConfirmDelete(null)
      fetchOrders()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Đơn hàng</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý và cập nhật trạng thái đơn hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => { setStatusFilter(''); setPage(1) }}
            style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 150ms', background: !statusFilter ? 'var(--neon-blue)' : 'var(--surface-raised)', color: !statusFilter ? '#000' : 'var(--text)', borderColor: !statusFilter ? 'var(--neon-blue)' : 'var(--border)' }}>
            Tất cả
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 150ms', background: statusFilter === s ? STATUS_COLORS[s].bg : 'var(--surface-raised)', color: statusFilter === s ? STATUS_COLORS[s].color : 'var(--muted)', borderColor: statusFilter === s ? STATUS_COLORS[s].border : 'var(--border)' }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Không có đơn hàng nào.</td></tr>
                )}
                {orders.map((o) => {
                  const sc = STATUS_COLORS[o.order_status?.name ?? ''] ?? { bg: 'rgba(107,107,138,0.1)', color: 'var(--muted)', border: 'var(--border)' }
                  return (
                    <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 700, color: 'var(--neon-blue)' }}>{o.order_code}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{(o as any).users?.full_name ?? 'N/A'}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>{Number(o.final_amount).toLocaleString('vi-VN')}₫</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={o.order_status?.name ?? ''}
                          onChange={(e) => updateStatus(o.order_id, e.target.value, o.order_status?.name)}
                          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, cursor: 'pointer', fontWeight: 600, outline: 'none' }}
                        >
                          {(ALLOWED_TRANSITIONS[o.order_status?.name ?? ''] ?? STATUS_OPTIONS).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12.5 }}>
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Link to={`/orders/${o.order_id}`} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)' }} title="Xem chi tiết">
                            <ExternalLink size={13} />
                          </Link>
                          {(o.order_status?.name === 'cancelled' || o.order_status?.name === 'delivered') && (
                            <button
                              onClick={() => setConfirmDelete({ order_id: o.order_id, order_code: o.order_code })}
                              title="Xoá đơn hàng"
                              style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, background: p === page ? 'var(--neon-blue)' : 'var(--surface-raised)', color: p === page ? '#000' : 'var(--text)', transition: 'all 150ms' }}
            >{p}</button>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ padding: '28px 32px', maxWidth: 400, width: '90%', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,77,106,0.12)', border: '1px solid rgba(255,77,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={22} style={{ color: 'var(--error)' }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Xoá đơn hàng?</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
              Bạn có chắc muốn xoá đơn <span style={{ color: 'var(--neon-blue)', fontFamily: 'monospace', fontWeight: 700 }}>{confirmDelete.order_code}</span>? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--error)', color: '#fff', fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: deleting ? 0.7 : 1 }}>
                {deleting ? 'Đang xoá...' : 'Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
