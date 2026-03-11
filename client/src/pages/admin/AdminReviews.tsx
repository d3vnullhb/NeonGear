import { useEffect, useState } from 'react'
import { Star, Trash2, Check, MessageSquare } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  const fetchReviews = () => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page), limit: '20' })
    if (filter === 'pending') q.set('is_approved', 'false')
    if (filter === 'approved') q.set('is_approved', 'true')
    api.get(`/admin/reviews?${q}`).then((res) => setReviews(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchReviews() }, [page, filter])

  const approve = async (id: number) => {
    await api.put(`/admin/reviews/${id}/approve`)
    fetchReviews()
  }

  const remove = async (id: number) => {
    if (!confirm('Xoá đánh giá?')) return
    await api.delete(`/admin/reviews/${id}`)
    fetchReviews()
  }

  const FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'approved', label: 'Đã duyệt' },
  ] as const

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Đánh giá</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Kiểm duyệt và quản lý đánh giá sản phẩm</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => { setFilter(key); setPage(1) }}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 150ms', background: filter === key ? 'var(--neon-blue)' : 'var(--surface-raised)', color: filter === key ? '#000' : 'var(--muted)', borderColor: filter === key ? 'var(--neon-blue)' : 'var(--border)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3, color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Không có đánh giá nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.review_id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,180,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--neon-blue)', flexShrink: 0 }}>
                  {r.users?.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{r.users?.full_name}</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.users?.email}</span>
                    <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill={i < r.rating ? 'var(--warning)' : 'none'} style={{ color: 'var(--warning)' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--neon-blue)', marginBottom: 6 }}>{r.products?.name}</div>
                  {r.comment && <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8 }}>{r.comment}</p>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: r.is_approved ? 'rgba(0,255,157,0.1)' : 'rgba(255,184,0,0.1)', color: r.is_approved ? 'var(--success)' : 'var(--warning)', border: `1px solid ${r.is_approved ? 'rgba(0,255,157,0.3)' : 'rgba(255,184,0,0.3)'}` }}>
                      {r.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {!r.is_approved && (
                    <button onClick={() => approve(r.review_id)} title="Duyệt" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.3)', color: 'var(--success)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,157,0.2)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,157,0.1)' }}
                    ><Check size={14} /></button>
                  )}
                  <button onClick={() => remove(r.review_id)} title="Xoá" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.2)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.1)' }}
                  ><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
