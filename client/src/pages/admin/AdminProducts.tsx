import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit, Search, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import type { Product, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<Product | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', slug: '', description: '', category_id: '', brand_id: '', is_active: true })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data.data ?? []))
    api.get('/brands').then((r) => setBrands(r.data.data ?? []))
  }, [])

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
    setEditing(null); setImageFile(null); setModal('create')
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, slug: p.slug, description: p.description ?? '', category_id: String(p.categories?.category_id ?? ''), brand_id: String(p.brands?.brand_id ?? ''), is_active: p.is_active ?? true })
    setImageFile(null); setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let productId: number
      if (modal === 'create') {
        const res = await api.post('/admin/products', form)
        productId = res.data.data.product_id
      } else {
        await api.put(`/admin/products/${editing?.product_id}`, form)
        productId = editing!.product_id
      }
      if (imageFile) {
        const fd = new FormData()
        fd.append('images', imageFile)
        fd.append('is_main', 'true')
        await api.post(`/admin/products/${productId}/images`, fd)
      }
      setModal(null); setImageFile(null); fetchProducts()
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
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              placeholder="Tìm sản phẩm..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', width: 180 }}
            />
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
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>{modal === 'create' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h2>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang lưu...' : 'Lưu sản phẩm'}</button>
              <button onClick={() => setModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
