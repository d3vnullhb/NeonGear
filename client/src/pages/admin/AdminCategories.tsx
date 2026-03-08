import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', is_visible: true })
  const [saving, setSaving] = useState(false)

  const fetchCategories = () => {
    setLoading(true)
    api.get('/admin/categories?limit=100').then((res) => setCategories(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  const setSlug = (name: string) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    setForm((f) => ({ ...f, name, slug }))
  }

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', is_visible: true }); setModal('create') }
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, slug: c.slug, is_visible: c.is_visible ?? true }); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await api.post('/admin/categories', form)
      else await api.put(`/admin/categories/${editing.category_id}`, form)
      setModal(null)
      fetchCategories()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá danh mục này?')) return
    await api.delete(`/admin/categories/${id}`)
    fetchCategories()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Danh mục</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"><Plus size={16} /> Thêm</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                {['Tên', 'Slug', 'Hiển thị', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium">
                    {c.image_url && <img src={c.image_url} className="w-8 h-8 rounded inline mr-2 object-cover" />}
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{c.slug}</td>
                  <td className="px-4 py-3"><span style={{ color: c.is_visible ? 'var(--success)' : 'var(--muted)' }}>{c.is_visible ? '✓' : '✗'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                      <button onClick={() => handleDelete(c.category_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
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
          <div className="card p-6 w-full max-w-md">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Tên *</label><input value={form.name} onChange={(e) => setSlug(e.target.value)} className="input-inset text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug *</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-inset text-sm" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="visible" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                <label htmlFor="visible" className="text-sm">Hiển thị</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
