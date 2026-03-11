import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Sliders } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

interface Attribute { attribute_id: number; name: string }

export default function AdminAttributes() {
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Attribute | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetch = () => {
    setLoading(true)
    api.get('/attributes').then((r) => setAttributes(r.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const openCreate = () => { setName(''); setEditing(null); setModal('create') }
  const openEdit = (a: Attribute) => { setName(a.name); setEditing(a); setModal('edit') }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (modal === 'create') await api.post('/admin/attributes', { name })
      else await api.put(`/admin/attributes/${editing!.attribute_id}`, { name })
      setModal(null); fetch()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá thuộc tính này?')) return
    try {
      await api.delete(`/admin/attributes/${id}`)
      fetch()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Không thể xoá')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Thuộc tính sản phẩm</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý các thuộc tính như màu sắc, kích thước, switch...</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
          <Plus size={15} /> Thêm thuộc tính
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {attributes.length === 0 && (
            <div className="card" style={{ padding: '48px 20px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Sliders size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3, color: 'var(--muted)' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chưa có thuộc tính nào</p>
            </div>
          )}
          {attributes.map((a) => (
            <div key={a.attribute_id} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, transition: 'transform 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,180,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sliders size={16} style={{ color: 'var(--neon-blue)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>ID: {a.attribute_id}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => openEdit(a)} title="Sửa" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={13} /></button>
                <button onClick={() => handleDelete(a.attribute_id)} title="Xoá" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>{modal === 'create' ? 'Thêm thuộc tính' : 'Sửa thuộc tính'}</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên thuộc tính *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="input-inset"
                style={{ fontSize: 13 }}
                placeholder="VD: Màu sắc, Switch, Kích thước..."
                autoFocus
              />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
