import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
      setModal(false)
      fetchCoupons()
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Coupon</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"><Plus size={16} /> Thêm</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Mã', 'Loại', 'Giá trị', 'Đã dùng', 'Hết hạn', 'Trạng thái', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.coupon_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--neon-blue)' }}>{c.code}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{c.discount_type}</td>
                    <td className="px-4 py-3 text-xs">{c.discount_type === 'percent' ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString('vi-VN')}₫`}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{c.used_count ?? 0}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString('vi-VN') : '∞'}</td>
                    <td className="px-4 py-3"><span style={{ color: c.is_active ? 'var(--success)' : 'var(--muted)' }}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(c.coupon_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">Tạo coupon</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Mã *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-inset text-sm font-mono" placeholder="SUMMER2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-inset text-sm">
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Cố định (₫)</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Giá trị *</label><input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} className="input-inset text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Đơn tối thiểu</label><input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} className="input-inset text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Giảm tối đa</label><input type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })} className="input-inset text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Hết hạn</label><input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input-inset text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Giới hạn</label><input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} className="input-inset text-sm" placeholder="Không giới hạn" /></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                <label htmlFor="active" className="text-sm">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Tạo'}</button>
              <button onClick={() => setModal(false)} className="btn-ghost flex-1">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
