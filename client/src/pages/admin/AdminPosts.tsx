import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', category: 'news', is_published: false })
  const [saving, setSaving] = useState(false)

  const fetchPosts = () => {
    setLoading(true)
    api.get('/admin/posts?limit=50').then((res) => setPosts(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchPosts() }, [])

  const setSlug = (title: string) => {
    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    setForm((f) => ({ ...f, title, slug }))
  }

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', category: 'news', is_published: false }); setModal('create') }
  const openEdit = (p: any) => { setEditing(p); setForm({ title: p.title, slug: p.slug, content: p.content ?? '', excerpt: p.excerpt ?? '', category: p.category ?? 'news', is_published: p.is_published ?? false }); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await api.post('/admin/posts', form)
      else await api.put(`/admin/posts/${editing.post_id}`, form)
      setModal(null)
      fetchPosts()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá bài viết?')) return
    await api.delete(`/admin/posts/${id}`)
    fetchPosts()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Bài viết</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"><Plus size={16} /> Thêm</button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                {['Tiêu đề', 'Danh mục', 'Trạng thái', 'Ngày tạo', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.post_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3"><span className="badge text-xs">{p.category}</span></td>
                  <td className="px-4 py-3"><span style={{ color: p.is_published ? 'var(--success)' : 'var(--warning)' }}>{p.is_published ? 'Đã đăng' : 'Nháp'}</span></td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : ''}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                      <button onClick={() => handleDelete(p.post_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
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
          <div className="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Thêm bài viết' : 'Sửa bài viết'}</h2>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Tiêu đề *</label><input value={form.title} onChange={(e) => setSlug(e.target.value)} className="input-inset text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug *</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-inset text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Danh mục</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-inset text-sm">
                    {['news', 'review', 'guide', 'event'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 self-end pb-1">
                  <input type="checkbox" id="pub" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                  <label htmlFor="pub" className="text-sm">Xuất bản</label>
                </div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Tóm tắt</label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input-inset text-sm" rows={2} /></div>
              <div><label className="block text-sm font-medium mb-1">Nội dung *</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-inset text-sm" rows={8} /></div>
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
