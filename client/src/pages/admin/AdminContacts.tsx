import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminContacts() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchContacts = () => {
    setLoading(true)
    const q = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/admin/contacts${q}`).then((res) => setContacts(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchContacts() }, [statusFilter])

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await api.put(`/admin/contacts/${selected.contact_id}/reply`, { reply })
      setSelected(null)
      setReply('')
      fetchContacts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSending(false)
    }
  }

  const statusColors: Record<string, string> = { pending: 'var(--warning)', replied: 'var(--success)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Liên hệ</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-inset text-sm" style={{ width: 'auto' }}>
          <option value="">Tất cả</option>
          <option value="pending">Chờ phản hồi</option>
          <option value="replied">Đã phản hồi</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.contact_id} className="card p-4 cursor-pointer hover:border-[var(--neon-blue)] transition-colors" style={{ borderColor: selected?.contact_id === c.contact_id ? 'var(--neon-blue)' : 'var(--border)' }} onClick={() => { setSelected(c); setReply('') }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.full_name}</span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{c.email}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: statusColors[c.status] || 'var(--muted)', border: `1px solid ${statusColors[c.status] || 'var(--border)'}` }}>{c.status}</span>
              </div>
              <p className="font-semibold text-sm">{c.subject}</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>{c.message}</p>
              {selected?.contact_id === c.contact_id && (
                <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--surface-raised)', color: 'var(--muted)' }}>{c.message}</div>
                  {c.reply && <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(0,180,255,0.05)', border: '1px solid rgba(0,180,255,0.2)' }}><span className="text-xs neon-text">Đã trả lời:</span> {c.reply}</div>}
                  {c.status === 'pending' && (
                    <div>
                      <textarea value={reply} onChange={(e) => setReply(e.target.value)} className="input-inset text-sm w-full" rows={3} placeholder="Nhập phản hồi..." />
                      <button onClick={handleReply} disabled={sending} className="btn-primary mt-2 py-2 px-4 text-sm">{sending ? 'Đang gửi...' : 'Gửi phản hồi'}</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {contacts.length === 0 && <p style={{ color: 'var(--muted)' }}>Không có liên hệ nào.</p>}
        </div>
      )}
    </div>
  )
}
