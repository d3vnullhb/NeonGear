import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Search, Layers, ArrowRight, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import type { Product, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

interface VariantEntry {
  sku: string
  base_price: string    // Giá gốc (required) — khi không KM → DB price; khi có KM → DB compare_price
  promo_price: string   // Giá khuyến mãi (optional) → DB price; base_price → DB compare_price
  initial_stock: string
  attrValues: { attribute_id: string; value: string }[]
  imageFile: File | null
}

// Transform form values → DB fields
function toDbPrice(base: string, promo: string) {
  return {
    price: promo || base,
    compare_price: promo ? base : undefined,
  }
}

// Transform DB fields → form values
function fromDbPrice(price: string | number, compare_price?: string | number | null) {
  if (compare_price) {
    return { base_price: String(compare_price), promo_price: String(price) }
  }
  return { base_price: String(price), promo_price: '' }
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [attributes, setAttributes] = useState<{ attribute_id: number; name: string }[]>([])
  const [form, setForm] = useState({ name: '', slug: '', description: '', category_id: '', brand_id: '', is_active: true })
  // CREATE: array of variant entries
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>([])
  // EDIT single-variant inline
  const [editVariant, setEditVariant] = useState({ base_price: '', promo_price: '', sku: '', initial_stock: '0' })
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null)
  const [editingVariantCount, setEditingVariantCount] = useState(0)
  const [editingStock, setEditingStock] = useState<number | null>(null)
  const [editAttrValues, setEditAttrValues] = useState<{ attribute_id: string; value: string }[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data ?? []))
    api.get('/brands').then((r) => setBrands(r.data.data ?? []))
    api.get('/attributes').then((r) => setAttributes(r.data.data ?? []))
  }, [])

  const newEntry = (): VariantEntry => ({
    sku: '', base_price: '', promo_price: '', initial_stock: '0',
    attrValues: attributes.map((a) => ({ attribute_id: String(a.attribute_id), value: '' })),
    imageFile: null,
  })

  const fetchProducts = () => {
    setLoading(true)
    api.get(`/admin/products?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then((res) => {
      setProducts(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [page])

  const openCreate = () => {
    setForm({ name: '', slug: '', description: '', category_id: '', brand_id: '', is_active: true })
    setVariantEntries([newEntry()])
    setEditing(null); setImageFile(null); setModal('create')
  }

  const openEdit = async (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, slug: p.slug, description: p.description ?? '', category_id: String(p.categories?.category_id ?? ''), brand_id: String(p.brands?.brand_id ?? ''), is_active: p.is_active ?? true })
    setEditVariant({ base_price: '', promo_price: '', sku: '', initial_stock: '0' })
    setEditingVariantId(null); setEditingVariantCount(0); setEditingStock(null)
    setEditAttrValues(attributes.map((a) => ({ attribute_id: String(a.attribute_id), value: '' })))
    setImageFile(null); setModal('edit')
    try {
      const res = await api.get(`/admin/products/${p.product_id}`)
      const product = res.data.data
      const variants: any[] = Array.isArray(product?.product_variants)
        ? product.product_variants
        : product?.product_variants ? [product.product_variants] : []
      setEditingVariantCount(variants.length)
      if (variants.length === 1) {
        const v = variants[0]
        setEditingVariantId(v.variant_id)
        setEditingStock(v.inventory?.quantity ?? 0)
        const { base_price, promo_price } = fromDbPrice(v.price, v.compare_price)
        setEditVariant({ base_price, promo_price, sku: v.sku ?? '', initial_stock: String(v.inventory?.quantity ?? 0) })
        setEditAttrValues(attributes.map((a) => ({
          attribute_id: String(a.attribute_id),
          value: v.product_attribute_values?.find((pav: any) => pav.attributes?.attribute_id === a.attribute_id)?.value ?? '',
        })))
      }
    } catch { /* ignore */ }
  }

  const updateEntry = (i: number, patch: Partial<VariantEntry>) =>
    setVariantEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))

  const updateEntryAttr = (i: number, attrId: string, value: string) =>
    setVariantEntries((prev) => prev.map((e, idx) => idx === i
      ? { ...e, attrValues: e.attrValues.map((a) => a.attribute_id === attrId ? { ...a, value } : a) }
      : e
    ))

  const addEntry = () => setVariantEntries((prev) => [...prev, newEntry()])

  const removeEntry = (i: number) =>
    setVariantEntries((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Vui lòng nhập tên sản phẩm'); return }
    if (modal === 'create') {
      for (const v of variantEntries) {
        if (!v.base_price) { alert('Vui lòng nhập giá gốc cho tất cả phiên bản'); return }
        if (!v.sku.trim()) { alert('Vui lòng nhập SKU cho tất cả phiên bản'); return }
      }
    }
    setSaving(true)
    try {
      let productId: number
      if (modal === 'create') {
        const res = await api.post('/admin/products', form)
        productId = res.data.data.product_id
        if (imageFile) {
          const fd = new FormData()
          fd.append('images', imageFile); fd.append('is_main', 'true')
          await api.post(`/admin/products/${productId}/images`, fd)
        }
        for (let i = 0; i < variantEntries.length; i++) {
          const v = variantEntries[i]
          const { price, compare_price } = toDbPrice(v.base_price, v.promo_price)
          const vPayload: any = {
            sku: v.sku, price, compare_price,
            is_active: true, is_default: i === 0,
            initial_stock: v.initial_stock || '0',
            attributes: v.attrValues.filter((a) => a.value.trim()).map((a) => ({ attribute_id: parseInt(a.attribute_id), value: a.value })),
          }
          if (v.imageFile) {
            const fd = new FormData()
            Object.entries(vPayload).forEach(([k, val]) => {
              if (k === 'attributes') fd.append(k, JSON.stringify(val))
              else if (val !== undefined) fd.append(k, String(val))
            })
            fd.append('image', v.imageFile)
            await api.post(`/admin/products/${productId}/variants`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          } else {
            await api.post(`/admin/products/${productId}/variants`, vPayload)
          }
        }
        setModal(null)
        navigate(`/admin/products/${productId}/variants`)
      } else {
        productId = editing!.product_id
        const updates: Promise<any>[] = [api.put(`/admin/products/${productId}`, form)]
        if (editingVariantId) {
          if (!editVariant.base_price) { alert('Vui lòng nhập giá gốc'); setSaving(false); return }
          if (!editVariant.sku.trim()) { alert('Vui lòng nhập SKU'); setSaving(false); return }
          const { price, compare_price } = toDbPrice(editVariant.base_price, editVariant.promo_price)
          updates.push(api.put(`/admin/products/${productId}/variants/${editingVariantId}`, {
            sku: editVariant.sku, price, compare_price,
            is_active: true, is_default: true,
            attributes: editAttrValues.filter((a) => a.value.trim()).map((a) => ({ attribute_id: parseInt(a.attribute_id), value: a.value })),
          }))
          const newQty = parseInt(editVariant.initial_stock ?? '0')
          if (!isNaN(newQty) && newQty !== editingStock) {
            const diff = newQty - (editingStock ?? 0)
            updates.push(api.post(`/admin/inventory/variants/${editingVariantId}/adjust`, {
              change_quantity: diff,
              transaction_type: diff > 0 ? 'import' : 'export',
              note: 'Admin điều chỉnh tồn kho',
            }))
          }
        }
        await Promise.all(updates)
        if (imageFile) {
          const fd = new FormData()
          fd.append('images', imageFile); fd.append('is_main', 'true')
          await api.post(`/admin/products/${productId}/images`, fd)
        }
        setModal(null); setImageFile(null); fetchProducts()
      }
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá sản phẩm này?')) return
    await api.delete(`/admin/products/${id}`)
    fetchProducts()
  }

  const setSlug = (name: string) => {
    const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    setForm((f) => ({ ...f, name, slug }))
  }

  // Reusable variant fields (used in both create cards and edit section)
  const VariantFields = ({ base_price, promo_price, sku, initial_stock, attrValues, imageFile: vImg, onChange, onAttrChange, onImageChange }: {
    base_price: string; promo_price: string; sku: string; initial_stock: string
    attrValues: { attribute_id: string; value: string }[]
    imageFile: File | null
    onChange: (patch: { base_price?: string; promo_price?: string; sku?: string; initial_stock?: string }) => void
    onAttrChange: (attrId: string, value: string) => void
    onImageChange: (file: File | null) => void
  }) => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>SKU *</label>
          <input value={sku} onChange={(e) => onChange({ sku: e.target.value })} className="input-inset" style={{ fontSize: 13, fontFamily: 'monospace' }} placeholder="NG-KB001-BLK" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>Tồn kho</label>
          <input type="number" min="0" value={initial_stock} onChange={(e) => onChange({ initial_stock: e.target.value })} className="input-inset" style={{ fontSize: 13 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>Giá gốc *</label>
          <input type="number" min="0" value={base_price} onChange={(e) => onChange({ base_price: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="1200000" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>Giá khuyến mãi <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(tùy chọn)</span></label>
          <input type="number" min="0" value={promo_price} onChange={(e) => onChange({ promo_price: e.target.value })} className="input-inset" style={{ fontSize: 13 }} placeholder="990000" />
        </div>
      </div>
      <div style={{ marginBottom: attributes.length > 0 ? 10 : 0 }}>
        <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 5 }}>Ảnh phiên bản</label>
        <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 12px', background: 'rgba(0,0,0,0.15)' }}>
          <input type="file" accept="image/*" onChange={(e) => onImageChange(e.target.files?.[0] ?? null)} style={{ fontSize: 12, color: 'var(--muted)', width: '100%' }} />
          {vImg && <p style={{ fontSize: 11.5, marginTop: 6, color: 'var(--success)' }}>✓ {vImg.name}</p>}
        </div>
      </div>
      {attributes.length > 0 && (
        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>Thuộc tính</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {attrValues.map((a) => {
              const attr = attributes.find((x) => String(x.attribute_id) === a.attribute_id)
              return (
                <div key={a.attribute_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12.5, width: 90, flexShrink: 0, color: 'var(--muted)', fontWeight: 500 }}>{attr?.name}</span>
                  <input value={a.value} onChange={(e) => onAttrChange(a.attribute_id, e.target.value)} className="input-inset" style={{ fontSize: 13, flex: 1 }} placeholder={`Giá trị ${attr?.name}`} />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Sản phẩm</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý danh sách sản phẩm trong cửa hàng</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProducts()} placeholder="Tìm sản phẩm..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', width: 180 }} />
          </div>
          <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
            <Plus size={15} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Sản phẩm', 'Danh mục', 'Thương hiệu', 'Trạng thái', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Không tìm thấy sản phẩm nào.</td></tr>
                )}
                {products.map((p) => {
                  const variant = Array.isArray(p.product_variants) ? p.product_variants[0] : p.product_variants
                  return (
                    <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {p.product_images?.[0]?.image_url
                            ? <img src={p.product_images[0].image_url} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                            : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🖱️</div>
                          }
                          <div>
                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
                            {variant && <div style={{ fontSize: 12, color: 'var(--neon-blue)' }}>{Number(variant.price).toLocaleString('vi-VN')}₫</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.categories?.name
                          ? <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: 'rgba(0,180,255,0.08)', color: 'var(--neon-blue)' }}>{p.categories.name}</span>
                          : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13 }}>{p.brands?.name ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: p.is_active ? 'rgba(0,255,157,0.1)' : 'rgba(255,77,106,0.1)', color: p.is_active ? 'var(--success)' : 'var(--error)', border: `1px solid ${p.is_active ? 'rgba(0,255,157,0.25)' : 'rgba(255,77,106,0.25)'}` }}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <Link to={`/admin/products/${p.product_id}/variants`} title="Quản lý biến thể" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-cyan)', transition: 'all 150ms' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,229,255,0.2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,229,255,0.1)' }}
                          ><Layers size={13} /></Link>
                          <button onClick={() => openEdit(p)} title="Sửa" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', cursor: 'pointer', transition: 'all 150ms' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,180,255,0.2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,180,255,0.1)' }}
                          ><Edit size={13} /></button>
                          <button onClick={() => handleDelete(p.product_id)} title="Xoá" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer', transition: 'all 150ms' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.2)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,106,0.1)' }}
                          ><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, background: p === page ? 'var(--neon-blue)' : 'var(--surface-raised)', color: p === page ? '#000' : 'var(--text)', transition: 'all 150ms' }}
            >{p}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)', position: 'sticky', top: 0, zIndex: 1 }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>{modal === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h2>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {/* Product base info */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên sản phẩm *</label>
                <input value={form.name} onChange={(e) => setSlug(e.target.value)} className="input-inset" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-inset" style={{ fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-inset" style={{ fontSize: 13 }} rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Danh mục</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-inset" style={{ fontSize: 13 }}>
                    <option value="">— Chọn —</option>
                    {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Thương hiệu</label>
                  <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="input-inset" style={{ fontSize: 13 }}>
                    <option value="">— Chọn —</option>
                    {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ảnh sản phẩm</label>
                <div style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: '12px 14px', background: 'rgba(0,0,0,0.2)' }}>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12.5, color: 'var(--muted)', width: '100%' }} />
                  {editing?.product_images?.[0]?.image_url && !imageFile && (
                    <img src={editing.product_images[0].image_url} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', marginTop: 10, border: '1px solid var(--border)' }} />
                  )}
                  {imageFile && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--success)' }}>✓ {imageFile.name}</p>}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)', width: 15, height: 15 }} />
                <span style={{ fontSize: 13 }}>Hiển thị sản phẩm (Active)</span>
              </label>

              {/* ── CREATE: variant entries ── */}
              {modal === 'create' && (
                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Layers size={14} style={{ color: 'var(--neon-cyan)' }} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Phiên bản sản phẩm <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>({variantEntries.length})</span></span>
                    </div>
                    <button type="button" onClick={addEntry} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 10px', borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)', color: 'var(--neon-blue)', cursor: 'pointer', fontWeight: 600 }}>
                      <Plus size={13} /> Thêm phiên bản
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {variantEntries.map((v, i) => (
                      <div key={i} style={{ background: 'rgba(0,180,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700 }}>Phiên bản {i + 1}</span>
                            {i === 0 && <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'rgba(0,229,255,0.12)', color: 'var(--neon-cyan)', border: '1px solid rgba(0,229,255,0.25)', fontWeight: 600 }}>Mặc định</span>}
                          </div>
                          {variantEntries.length > 1 && (
                            <button type="button" onClick={() => removeEntry(i)} style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                        <VariantFields
                          {...v}
                          onChange={(patch) => updateEntry(i, patch)}
                          onAttrChange={(attrId, value) => updateEntryAttr(i, attrId, value)}
                          onImageChange={(file) => updateEntry(i, { imageFile: file })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EDIT: single-variant inline ── */}
              {modal === 'edit' && editing && (
                <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {editingVariantCount === 1 ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Layers size={14} style={{ color: 'var(--neon-cyan)' }} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>Giá, SKU & thuộc tính</span>
                      </div>
                      <VariantFields
                        base_price={editVariant.base_price}
                        promo_price={editVariant.promo_price}
                        sku={editVariant.sku}
                        initial_stock={editVariant.initial_stock}
                        attrValues={editAttrValues}
                        imageFile={null}
                        onChange={(patch) => setEditVariant((v) => ({ ...v, ...patch }))}
                        onAttrChange={(attrId, value) => setEditAttrValues((prev) => prev.map((a) => a.attribute_id === attrId ? { ...a, value } : a))}
                        onImageChange={() => {}}
                      />
                    </>
                  ) : (
                    <Link
                      to={`/admin/products/${editing.product_id}/variants`}
                      onClick={() => setModal(null)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)', textDecoration: 'none', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.12)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,229,255,0.06)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={14} style={{ color: 'var(--neon-cyan)' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--neon-cyan)' }}>
                          {editingVariantCount === 0 ? 'Thêm phiên bản & giá' : `Quản lý ${editingVariantCount} phiên bản, giá & tồn kho`}
                        </span>
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--neon-cyan)' }} />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface)', position: 'sticky', bottom: 0 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>
                {saving ? 'Đang lưu...' : modal === 'create' ? `Lưu & tạo ${variantEntries.length} phiên bản →` : 'Lưu sản phẩm'}
              </button>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
