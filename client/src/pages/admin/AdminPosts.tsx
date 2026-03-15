import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Image, FileText } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminPosts() {
  const [posts, setPosts] = useState<any[]>([])
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', category: '', is_published: false })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchPosts = () => {
    setLoading(true)
    api.get('/admin/posts?limit=50').then((res) => setPosts(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPosts()
    api.get('/admin/post-categories').then(r => setCats(r.data.data ?? []))
  }, [])

  const setSlug = (title: string) => {
    const slug = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    setForm((f) => ({ ...f, title, slug }))
  }

  const openCreate = () => { setEditing(null); setForm({ title: '', slug: '', content: '', excerpt: '', category: cats[0]?.slug ?? '', is_published: false }); setImageFile(null); setModal('create') }
  const openEdit = (p: any) => { setEditing(p); setForm({ title: p.title, slug: p.slug, content: p.content ?? '', excerpt: p.excerpt ?? '', category: p.category ?? 'news', is_published: p.is_published ?? false }); setImageFile(null); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)))
      if (imageFile) fd.append('thumbnail', imageFile)
      if (modal === 'create') await api.post('/admin/posts', fd)
      else await api.put(`/admin/posts/${editing.post_id}`, fd)
      setModal(null); setImageFile(null); fetchPosts()
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Bài viết</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý nội dung tin tức, hướng dẫn và sự kiện</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
          <Plus size={15} /> Thêm bài viết
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
                  {['Bài viết', 'Danh mục', 'Trạng thái', 'Ngày tạo', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    <FileText size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    Chưa có bài viết nào
                  </td></tr>
                )}
                {posts.map((p) => (
                  <tr key={p.post_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.thumbnail
                          ? <img src={p.thumbnail} style={{ width: 52, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                          : <div style={{ width: 52, height: 36, borderRadius: 6, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--muted)' }}><Image size={16} /></div>
                        }
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>{p.title}</div>
                          {p.excerpt && <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280, marginTop: 2 }}>{p.excerpt}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {(() => { const cat = cats.find(c => c.slug === p.category); const color = cat?.color ?? 'var(--muted)'; return (
                        <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, fontWeight: 600, background: `${color}18`, color, border: `1px solid ${color}30` }}>
                          {cat?.name ?? p.category}
                        </span>
                      )})()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: p.is_published ? 'rgba(0,255,157,0.1)' : 'rgba(255,184,0,0.1)', color: p.is_published ? 'var(--success)' : 'var(--warning)', border: `1px solid ${p.is_published ? 'rgba(0,255,157,0.25)' : 'rgba(255,184,0,0.25)'}` }}>
                        {p.is_published ? 'Đã đăng' : 'Nháp'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12.5 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('vi-VN') : ''}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(p)} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={13} /></button>
                        <button onClick={() => handleDelete(p.post_id)} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>{modal === 'create' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tiêu đề *</label>
                <input value={form.title} onChange={(e) => setSlug(e.target.value)} className="input-inset" style={{ fontSize: 13 }} autoFocus />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-inset" style={{ fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Danh mục</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-inset" style={{ fontSize: 13 }}>
                    {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 10 }}>
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} style={{ accentColor: 'var(--neon-blue)', width: 15, height: 15 }} />
                  <span style={{ fontSize: 13 }}>Xuất bản</span>
                </label>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tóm tắt</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input-inset" style={{ fontSize: 13 }} rows={2} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nội dung *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-inset" style={{ fontSize: 13 }} rows={8} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ảnh thumbnail</label>
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '12px 14px', background: 'rgba(0,0,0,0.2)' }}>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12.5, color: 'var(--muted)', width: '100%' }} />
                  {editing?.thumbnail && !imageFile && (
                    <img src={editing.thumbnail} style={{ width: 96, height: 64, borderRadius: 6, objectFit: 'cover', marginTop: 10, border: '1px solid var(--border)' }} />
                  )}
                  {imageFile && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--success)' }}>✓ {imageFile.name}</p>}
                </div>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang lưu...' : 'Lưu bài viết'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
