import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

const PRESET_COLORS = ['#00b4ff', '#a78bfa', '#00e5ff', '#00ff9d', '#ffb800', '#f97316', '#ff4d6a', '#e879f9']

const toSlug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

export default function AdminPostCategories() {
  const [cats, setCats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', color: '#00b4ff' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/post-categories').then(r => setCats(r.data.data ?? [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', slug: '', color: '#00b4ff' })
    setError('')
    setModal('create')
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, color: c.color ?? '#00b4ff' })
    setError('')
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) { setError('Tên và slug là bắt buộc'); return }
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') await api.post('/admin/post-categories', form)
      else await api.put(`/admin/post-categories/${editing.id}`, form)
      setModal(null)
      load()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Lỗi lưu')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá danh mục này?')) return
    await api.delete(`/admin/post-categories/${id}`)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Danh mục bài viết</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Quản lý các danh mục để phân loại bài viết</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
          <Plus size={15} /> Thêm danh mục
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><Spinner size={40} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {cats.map(c => (
            <div key={c.id} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Color dot */}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${c.color}18`, border: `2px solid ${c.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Tag size={18} style={{ color: c.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{c.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>{c.slug}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} className="btn-ghost" style={{ padding: '6px 8px' }}><Edit size={13} /></button>
                <button onClick={() => handleDelete(c.id)} className="btn-ghost" style={{ padding: '6px 8px', color: 'var(--error)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}

          {cats.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontSize: 14 }}>
              Chưa có danh mục nào.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setModal(null)} />
          <div className="card" style={{ position: 'relative', zIndex: 1, width: 420, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, marginBottom: 22 }}>
              {modal === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tên danh mục</label>
                <input
                  className="input-inset" value={form.name} placeholder="VD: Tin tức"
                  onChange={e => setForm({ ...form, name: e.target.value, slug: toSlug(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 14 }}
                />
              </div>

              {/* Slug */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slug</label>
                <input
                  className="input-inset" value={form.slug} placeholder="VD: tin-tuc"
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', fontSize: 13, fontFamily: 'monospace' }}
                />
              </div>

              {/* Color */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Màu hiển thị</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {PRESET_COLORS.map(col => (
                    <button key={col} onClick={() => setForm({ ...form, color: col })}
                      style={{ width: 28, height: 28, borderRadius: 8, background: col, border: form.color === col ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === col ? `0 0 8px ${col}` : 'none', transition: 'all 150ms' }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', padding: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>{form.color}</span>
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${form.color}18`, color: form.color, border: `1px solid ${form.color}40` }}>
                    {form.name || 'Preview'}
                  </span>
                </div>
              </div>
            </div>

            {error && <p style={{ fontSize: 13, color: 'var(--error)', marginTop: 12 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ fontSize: 13 }}>Huỷ</button>
              <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ fontSize: 13, minWidth: 100 }}>
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
