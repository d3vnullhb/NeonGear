import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit } from 'lucide-react'
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
      setModal(null)
      fetch()
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Thuộc tính sản phẩm</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
          <Plus size={16} /> Thêm
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                {['ID', 'Tên thuộc tính', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((a) => (
                <tr key={a.attribute_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>#{a.attribute_id}</td>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                      <button onClick={() => handleDelete(a.attribute_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!attributes.length && (
                <tr><td colSpan={3} className="text-center px-4 py-10" style={{ color: 'var(--muted)' }}>Chưa có thuộc tính nào</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Thêm thuộc tính' : 'Sửa thuộc tính'}</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Tên thuộc tính *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="input-inset text-sm" placeholder="VD: Màu sắc, Switch, Size..." autoFocus />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost flex-1">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
