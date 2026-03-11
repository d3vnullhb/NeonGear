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
    setImageFile(null); setModal('create')
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
    setImageFile(null); setModal('edit')
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
      setModal(null); fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (variantId: number) => {
    if (!confirm('Xoá biến thể này?')) return
    await api.delete(`/admin/products/${id}/variants/${variantId}`)
    fetchData()
  }

  const setAttrValue = (attribute_id: string, value: string) => {
    setForm((f) => ({ ...f, attributes: f.attributes.map((a) => a.attribute_id === attribute_id ? { ...a, value } : a) }))
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={48} /></div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/admin/products" style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', textDecoration: 'none', flexShrink: 0, transition: 'all 150ms' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,180,255,0.4)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' }}
        ><ArrowLeft size={16} /></Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Biến thể — {product?.name}</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý SKU, giá, tồn kho cho từng phiên bản sản phẩm</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, flexShrink: 0 }}>
          <Plus size={15} /> Thêm biến thể
        </button>
      </div>

      {/* Variants */}
      {variants.length === 0 ? (
        <div className="card" style={{ padding: '64px 20px', textAlign: 'center' }}>
          <Package size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25, color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>Chưa có biến thể nào. Thêm biến thể đầu tiên!</p>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', fontSize: 13 }}>
            <Plus size={15} /> Thêm biến thể
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Ảnh', 'SKU', 'Giá bán', 'Tồn kho', 'Thuộc tính', 'Mặc định', 'Trạng thái', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.variant_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      {v.image_url
                        ? <img src={v.image_url} style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} />
                        : <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>{v.sku}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--neon-blue)' }}>{Number(v.price).toLocaleString('vi-VN')}₫</div>
                      {v.compare_price && <div style={{ fontSize: 12, textDecoration: 'line-through', color: 'var(--muted)' }}>{Number(v.compare_price).toLocaleString('vi-VN')}₫</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: (v.inventory?.quantity ?? 0) > 10 ? 'var(--success)' : (v.inventory?.quantity ?? 0) > 0 ? 'var(--warning)' : 'var(--error)' }}>
                        {v.inventory?.quantity ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {v.product_attribute_values?.map((pav) => (
                          <span key={pav.attributes.attribute_id} style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,180,255,0.1)', color: 'var(--neon-blue)', border: '1px solid rgba(0,180,255,0.2)', whiteSpace: 'nowrap' }}>
                            {pav.attributes.name}: {pav.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {v.is_default && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: 'rgba(0,229,255,0.1)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,229,255,0.25)' }}>Mặc định</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: v.is_active ? 'rgba(0,255,157,0.1)' : 'rgba(255,77,106,0.1)', color: v.is_active ? 'var(--success)' : 'var(--error)', border: `1px solid ${v.is_active ? 'rgba(0,255,157,0.25)' : 'rgba(255,77,106,0.25)'}` }}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(v)} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={13} /></button>
                        <button onClick={() => handleDelete(v.variant_id)} style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>{modal === 'create' ? 'Thêm biến thể mới' : 'Chỉnh sửa biến thể'}</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>SKU *</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-inset" style={{ fontSize: 13, fontFamily: 'monospace' }} placeholder="NG-KB001-BLK" />
                </div>
                {modal === 'create' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tồn kho ban đầu</label>
                    <input type="number" min="0" value={form.initial_stock} onChange={(e) => setForm({ ...form, initial_stock: e.target.value })} className="input-inset" style={{ fontSize: 13 }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giá bán *</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="990000" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giá gốc (so sánh)</label>
                  <input type="number" min="0" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="1200000" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ảnh biến thể</label>
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '12px 14px', background: 'rgba(0,0,0,0.2)' }}>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12.5, color: 'var(--muted)', width: '100%' }} />
                  {editing?.image_url && !imageFile && (
                    <img src={editing.image_url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', marginTop: 10, border: '1px solid var(--border)' }} />
                  )}
                  {imageFile && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--success)' }}>✓ {imageFile.name}</p>}
                </div>
              </div>
              {attributes.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Thuộc tính</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.attributes.map((a) => {
                      const attr = attributes.find((x) => String(x.attribute_id) === a.attribute_id)
                      return (
                        <div key={a.attribute_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 13, width: 80, flexShrink: 0, color: 'var(--muted)', fontWeight: 500 }}>{attr?.name}</span>
                          <input value={a.value} onChange={(e) => setAttrValue(a.attribute_id, e.target.value)} className="input-inset" style={{ fontSize: 13, flex: 1 }} placeholder={`Giá trị ${attr?.name}`} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)', width: 15, height: 15 }} />
                  <span style={{ fontSize: 13 }}>Active</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} style={{ accentColor: 'var(--neon-blue)', width: 15, height: 15 }} />
                  <span style={{ fontSize: 13 }}>Đặt làm mặc định</span>
                </label>
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang lưu...' : 'Lưu biến thể'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
