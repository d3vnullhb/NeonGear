import { useEffect, useState } from 'react'
import { Plus, Trash2, Ticket } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_discount_amount: '', expiry_date: '', usage_limit: '', is_active: true })
  const [saving, setSaving] = useState(false)

  const fetchCoupons = () => {
    setLoading(true)
    api.get('/admin/coupons?limit=100').then((res) => setCoupons(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/admin/coupons', form)
      setModal(false); fetchCoupons()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá coupon?')) return
    await api.delete(`/admin/coupons/${id}`)
    fetchCoupons()
  }

  const openModal = () => {
    setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_discount_amount: '', expiry_date: '', usage_limit: '', is_active: true })
    setModal(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Coupon</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Tạo và quản lý mã giảm giá</p>
        </div>
        <button onClick={openModal} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
          <Plus size={15} /> Tạo coupon
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Mã coupon', 'Loại / Giá trị', 'Đã dùng', 'Đơn tối thiểu', 'Hết hạn', 'Trạng thái', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Ticket size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    Chưa có coupon nào
                  </td></tr>
                )}
                {coupons.map((c) => (
                  <tr key={c.coupon_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: 'var(--neon-blue)', background: 'rgba(0,180,255,0.08)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(0,180,255,0.2)', letterSpacing: '0.05em' }}>{c.code}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13 }}>{c.discount_type === 'percent' ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString('vi-VN')}₫`}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{c.discount_type === 'percent' ? 'Phần trăm' : 'Cố định'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{c.used_count ?? 0}</span>
                      {c.usage_limit && <span style={{ color: 'var(--muted)', fontSize: 12 }}>/{c.usage_limit}</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13 }}>
                      {c.min_order_amount ? `${Number(c.min_order_amount).toLocaleString('vi-VN')}₫` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12.5 }}>
                      {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('vi-VN') : '∞'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: c.is_active ? 'rgba(0,255,157,0.1)' : 'rgba(255,77,106,0.1)', color: c.is_active ? 'var(--success)' : 'var(--error)', border: `1px solid ${c.is_active ? 'rgba(0,255,157,0.25)' : 'rgba(255,77,106,0.25)'}` }}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleDelete(c.coupon_id)} title="Xoá" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>Tạo coupon mới</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mã coupon *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-inset" style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.05em' }} placeholder="SUMMER2026" autoFocus />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Loại giảm giá</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-inset" style={{ fontSize: 13 }}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Cố định (₫)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giá trị *</label>
                  <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder={form.discount_type === 'percent' ? '10' : '50000'} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Đơn tối thiểu (₫)</label>
                  <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="200000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giảm tối đa (₫)</label>
                  <input type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="100000" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ngày hết hạn</label>
                  <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input-inset" style={{ fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giới hạn sử dụng</label>
                  <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="Không giới hạn" />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)', width: 15, height: 15 }} />
                <span style={{ fontSize: 13 }}>Kích hoạt coupon</span>
              </label>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang tạo...' : 'Tạo coupon'}</button>
              <button onClick={() => setModal(false)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
