import { useEffect, useState } from 'react'
import { MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react'
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
      setSelected(null); setReply(''); fetchContacts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSending(false)
    }
  }

  const toggleSelect = (c: any) => {
    setSelected(selected?.contact_id === c.contact_id ? null : c)
    setReply('')
  }

  const FILTERS = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ phản hồi' },
    { value: 'replied', label: 'Đã phản hồi' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Liên hệ</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Phản hồi tin nhắn và yêu cầu từ khách hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(({ value, label }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 150ms', background: statusFilter === value ? 'var(--neon-blue)' : 'var(--surface-raised)', color: statusFilter === value ? '#000' : 'var(--muted)', borderColor: statusFilter === value ? 'var(--neon-blue)' : 'var(--border)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : contacts.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <MessageSquare size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3, color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Không có liên hệ nào.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contacts.map((c) => {
            const isOpen = selected?.contact_id === c.contact_id
            const isPending = c.status === 'pending'
            return (
              <div key={c.contact_id} className="card" style={{ overflow: 'hidden', borderColor: isOpen ? 'rgba(0,180,255,0.4)' : 'var(--border)', transition: 'border-color 150ms' }}>
                {/* Header */}
                <div style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => toggleSelect(c)}>
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: isPending ? 'rgba(255,184,0,0.15)' : 'rgba(0,255,157,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: isPending ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }}>
                    {c.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{c.full_name}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.email}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11.5, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: isPending ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,157,0.1)', color: isPending ? 'var(--warning)' : 'var(--success)', border: `1px solid ${isPending ? 'rgba(255,184,0,0.3)' : 'rgba(0,255,157,0.3)'}`, flexShrink: 0 }}>
                        {isPending ? 'Chờ phản hồi' : 'Đã phản hồi'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.subject}</div>
                    {!isOpen && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message}</div>}
                  </div>
                  <div style={{ color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--surface-raised)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)' }}>
                        {c.message}
                      </div>
                      {c.reply && (
                        <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,180,255,0.05)', border: '1px solid rgba(0,180,255,0.2)', fontSize: 13.5, lineHeight: 1.6 }}>
                          <div style={{ fontSize: 11.5, color: 'var(--neon-blue)', fontWeight: 600, marginBottom: 6 }}>↩ Phản hồi của bạn</div>
                          {c.reply}
                        </div>
                      )}
                      {isPending && (
                        <div>
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            className="input-inset"
                            style={{ fontSize: 13, width: '100%', marginBottom: 8 }}
                            rows={3}
                            placeholder="Nhập phản hồi cho khách hàng..."
                          />
                          <button onClick={handleReply} disabled={sending || !reply.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13 }}>
                            <Send size={14} /> {sending ? 'Đang gửi...' : 'Gửi phản hồi'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
