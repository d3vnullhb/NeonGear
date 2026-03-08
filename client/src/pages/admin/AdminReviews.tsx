import { useEffect, useState } from 'react'
import { Star, Trash2, Check } from 'lucide-react'
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Đánh giá</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={filter === f ? 'btn-primary py-1 px-3 text-sm' : 'btn-ghost py-1 px-3 text-sm'}>{f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.review_id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.users?.full_name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{r.users?.email}</span>
                    <div className="flex gap-0.5 ml-auto">{[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--warning)' : 'none'} style={{ color: 'var(--warning)' }} />)}</div>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'var(--neon-blue)' }}>{r.products?.name}</p>
                  {r.comment && <p className="text-sm" style={{ color: 'var(--muted)' }}>{r.comment}</p>}
                  <span className="text-xs mt-1 inline-block" style={{ color: r.is_approved ? 'var(--success)' : 'var(--warning)' }}>{r.is_approved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!r.is_approved && <button onClick={() => approve(r.review_id)} style={{ background: 'rgba(0,255,157,0.1)', border: '1px solid rgba(0,255,157,0.3)', color: 'var(--success)', cursor: 'pointer', borderRadius: 6, padding: '4px 8px' }}><Check size={14} /></button>}
                  <button onClick={() => remove(r.review_id)} style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', color: 'var(--error)', cursor: 'pointer', borderRadius: 6, padding: '4px 8px' }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && <p style={{ color: 'var(--muted)' }}>Không có đánh giá nào.</p>}
        </div>
      )}
    </div>
  )
}
