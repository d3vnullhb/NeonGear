import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Plus, Trash2, Edit, ArrowLeft, Package } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

interface Variant {
  variant_id: number
  sku: string
  price: number
  compare_price?: number
  image_url?: string
  is_active: boolean
  is_default: boolean
  inventory?: { quantity: number }
  product_attribute_values?: { value: string; attributes: { attribute_id: number; name: string } }[]
}

interface Attribute { attribute_id: number; name: string }

const emptyForm = { sku: '', price: '', compare_price: '', is_active: true, is_default: false, initial_stock: '0', attributes: [] as { attribute_id: string; value: string }[] }

export default function AdminProductVariants() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Variant | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      api.get(`/admin/products/${id}`),
      api.get('/attributes'),
    ]).then(([pRes, aRes]) => {
      setProduct(pRes.data.data)
      setVariants(pRes.data.data?.product_variants ?? [])
      setAttributes(aRes.data.data ?? [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, attributes: attributes.map((a) => ({ attribute_id: String(a.attribute_id), value: '' })) })
    setImageFile(null)
    setModal('create')
  }

  const openEdit = (v: Variant) => {
    setEditing(v)
    setForm({
      sku: v.sku,
      price: String(v.price),
      compare_price: v.compare_price ? String(v.compare_price) : '',
      is_active: v.is_active,
      is_default: v.is_default,
      initial_stock: '',
      attributes: attributes.map((a) => ({
        attribute_id: String(a.attribute_id),
        value: v.product_attribute_values?.find((pav) => pav.attributes.attribute_id === a.attribute_id)?.value ?? '',
      })),
    })
    setImageFile(null)
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.sku || !form.price) { alert('SKU và giá là bắt buộc'); return }
    setSaving(true)
    try {
      const attrs = form.attributes.filter((a) => a.value.trim())
      const payload: any = {
        sku: form.sku,
        price: form.price,
        compare_price: form.compare_price || undefined,
        is_active: form.is_active,
        is_default: form.is_default,
        attributes: attrs.map((a) => ({ attribute_id: parseInt(a.attribute_id), value: a.value })),
      }

      if (modal === 'create') {
        payload.initial_stock = form.initial_stock
        if (imageFile) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => {
            if (k === 'attributes') fd.append(k, JSON.stringify(v))
            else fd.append(k, String(v))
          })
          fd.append('image', imageFile)
          await api.post(`/admin/products/${id}/variants`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          await api.post(`/admin/products/${id}/variants`, payload)
        }
      } else {
        if (imageFile) {
          const fd = new FormData()
          Object.entries(payload).forEach(([k, v]) => {
            if (k === 'attributes') fd.append(k, JSON.stringify(v))
            else fd.append(k, String(v))
          })
          fd.append('image', imageFile)
          await api.put(`/admin/products/${id}/variants/${editing!.variant_id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        } else {
          await api.put(`/admin/products/${id}/variants/${editing!.variant_id}`, payload)
        }
      }
      setModal(null)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (variantId: number) => {
    if (!confirm('Xoá variant này?')) return
    await api.delete(`/admin/products/${id}/variants/${variantId}`)
    fetchData()
  }

  const setAttrValue = (attribute_id: string, value: string) => {
    setForm((f) => ({ ...f, attributes: f.attributes.map((a) => a.attribute_id === attribute_id ? { ...a, value } : a) }))
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={48} /></div>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/products" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold">Variants — {product?.name}</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Quản lý SKU, giá, tồn kho cho từng phiên bản</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm ml-auto">
          <Plus size={16} /> Thêm variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="card p-16 text-center">
          <Package size={48} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)' }}>Chưa có variant nào. Thêm variant đầu tiên!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Ảnh', 'SKU', 'Giá', 'Kho', 'Thuộc tính', 'Default', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.variant_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3">
                      {v.image_url
                        ? <img src={v.image_url} className="w-10 h-10 rounded object-cover" />
                        : <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: 'var(--surface-raised)', color: 'var(--muted)', fontSize: 18 }}>📦</div>}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{v.sku}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold neon-text">{Number(v.price).toLocaleString('vi-VN')}₫</p>
                      {v.compare_price && <p className="text-xs line-through" style={{ color: 'var(--muted)' }}>{Number(v.compare_price).toLocaleString('vi-VN')}₫</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{v.inventory?.quantity ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {v.product_attribute_values?.map((pav) => (
                          <span key={pav.attributes.attribute_id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,180,255,0.1)', color: 'var(--neon-blue)' }}>
                            {pav.attributes.name}: {pav.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {v.is_default && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--neon-cyan)' }}>Default</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: v.is_active ? 'rgba(0,255,157,0.1)' : 'rgba(255,77,106,0.1)', color: v.is_active ? 'var(--success)' : 'var(--error)' }}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(v.variant_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
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
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Thêm variant' : 'Sửa variant'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">SKU *</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-inset text-sm" placeholder="NG-KB001-BLK" />
                </div>
                {modal === 'create' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Tồn kho ban đầu</label>
                    <input type="number" min="0" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} className="input-inset text-sm" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Giá bán *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-inset text-sm" placeholder="990000" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá gốc</label>
                  <input type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className="input-inset text-sm" placeholder="1200000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ảnh variant</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="text-sm" style={{ color: 'var(--muted)' }} />
                {editing?.image_url && !imageFile && <img src={editing.image_url} className="w-16 h-16 rounded object-cover mt-2" />}
              </div>

              {attributes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Thuộc tính</label>
                  <div className="space-y-2">
                    {form.attributes.map((a) => {
                      const attr = attributes.find((x) => String(x.attribute_id) === a.attribute_id)
                      return (
                        <div key={a.attribute_id} className="flex items-center gap-2">
                          <span className="text-xs w-24 shrink-0" style={{ color: 'var(--muted)' }}>{attr?.name}</span>
                          <input value={a.value} onChange={(e) => setAttrValue(a.attribute_id, e.target.value)} className="input-inset text-sm" placeholder={`Giá trị ${attr?.name}`} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                  <span className="text-sm">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                  <span className="text-sm">Default variant</span>
                </label>
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
