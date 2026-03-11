import { useEffect, useState } from 'react'
import { Mail, Trash2, ToggleLeft, ToggleRight, Search, Users, UserCheck, UserX, Download } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

interface Subscriber {
  subscriber_id: number
  email: string
  is_active: boolean | null
  subscribed_at: string | null
  unsubscribed_at: string | null
}

interface Stats { total: number; active: number; inactive: number }

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (filterActive) params.set('active', filterActive)

      const [listRes, statsRes] = await Promise.all([
        api.get(`/admin/subscribers?${params}`),
        api.get('/admin/subscribers/stats'),
      ])
      setSubscribers(listRes.data.data ?? [])
      setTotalPages(listRes.data.pagination?.totalPages ?? 1)
      setTotal(listRes.data.pagination?.total ?? 0)
      setStats(statsRes.data.data ?? { total: 0, active: 0, inactive: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [page, filterActive])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleToggle = async (id: number) => {
    await api.patch(`/admin/subscribers/${id}/toggle`)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá subscriber này?')) return
    await api.delete(`/admin/subscribers/${id}`)
    fetchData()
  }

  const exportCSV = () => {
    const rows = [['ID', 'Email', 'Trạng thái', 'Ngày đăng ký']]
    subscribers.forEach((s) => rows.push([
      String(s.subscriber_id),
      s.email,
      s.is_active ? 'Hoạt động' : 'Đã huỷ',
      s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('vi-VN') : '',
    ]))
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click()
  }

  const statCards = [
    { icon: Users,     label: 'Tổng số',        value: stats.total,    color: 'var(--neon-blue)', bg: 'rgba(0,180,255,0.1)' },
    { icon: UserCheck, label: 'Đang hoạt động', value: stats.active,   color: 'var(--success)',   bg: 'rgba(0,255,157,0.1)' },
    { icon: UserX,     label: 'Đã huỷ đăng ký', value: stats.inactive, color: 'var(--error)',     bg: 'rgba(255,77,106,0.1)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk', marginBottom: 4 }}>Đăng ký nhận tin</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Quản lý danh sách email đăng ký nhận khuyến mãi</p>
        </div>
        <button
          onClick={exportCSV}
          className="btn-ghost"
          style={{ fontSize: 13, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Download size={14} /> Xuất CSV
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ flex: '1 1 240px', position: 'relative', minWidth: 200 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email..."
            className="input-inset"
            style={{ fontSize: 13, paddingLeft: 36 }}
          />
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        </form>

        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Tất cả', value: '' },
            { label: 'Hoạt động', value: 'true' },
            { label: 'Đã huỷ', value: 'false' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setFilterActive(opt.value as '' | 'true' | 'false'); setPage(1) }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                background: filterActive === opt.value ? 'rgba(0,180,255,0.15)' : 'transparent',
                color: filterActive === opt.value ? 'var(--neon-blue)' : 'var(--muted)',
                borderColor: filterActive === opt.value ? 'rgba(0,180,255,0.4)' : 'var(--border)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{total.toLocaleString()} kết quả</span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><Spinner size={40} /></div>
        ) : subscribers.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <Mail size={40} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chưa có ai đăng ký nhận tin</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['#', 'Email', 'Trạng thái', 'Ngày đăng ký', 'Ngày huỷ', 'Hành động'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr
                    key={s.subscriber_id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '11px 14px', color: 'var(--muted)', fontSize: 12 }}>{s.subscriber_id}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,180,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Mail size={13} style={{ color: 'var(--neon-blue)' }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        fontSize: 11.5, padding: '3px 10px', borderRadius: 20, fontWeight: 600,
                        background: s.is_active ? 'rgba(0,255,157,0.12)' : 'rgba(255,77,106,0.12)',
                        color: s.is_active ? 'var(--success)' : 'var(--error)',
                        border: `1px solid ${s.is_active ? 'rgba(0,255,157,0.3)' : 'rgba(255,77,106,0.3)'}`,
                      }}>
                        {s.is_active ? 'Hoạt động' : 'Đã huỷ'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', color: 'var(--muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {s.unsubscribed_at ? new Date(s.unsubscribed_at).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleToggle(s.subscriber_id)}
                          title={s.is_active ? 'Huỷ kích hoạt' : 'Kích hoạt lại'}
                          style={{
                            padding: '5px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', border: '1px solid',
                            background: s.is_active ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,157,0.1)',
                            color: s.is_active ? 'var(--warning)' : 'var(--success)',
                            borderColor: s.is_active ? 'rgba(255,184,0,0.3)' : 'rgba(0,255,157,0.3)',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {s.is_active ? <ToggleLeft size={13} /> : <ToggleRight size={13} />}
                          {s.is_active ? 'Huỷ' : 'Bật'}
                        </button>
                        <button
                          onClick={() => handleDelete(s.subscriber_id)}
                          title="Xoá"
                          style={{
                            padding: '5px 8px', borderRadius: 6, cursor: 'pointer', border: '1px solid rgba(255,77,106,0.3)',
                            background: 'rgba(255,77,106,0.1)', color: 'var(--error)', display: 'flex', alignItems: 'center',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: 6 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, borderRadius: 6, fontSize: 13, cursor: 'pointer', border: '1px solid',
                  background: p === page ? 'rgba(0,180,255,0.15)' : 'transparent',
                  color: p === page ? 'var(--neon-blue)' : 'var(--muted)',
                  borderColor: p === page ? 'rgba(0,180,255,0.4)' : 'var(--border)',
                  fontWeight: p === page ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
