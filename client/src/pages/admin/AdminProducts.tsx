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
    setEditing(null)
    setModal('create')
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, slug: p.slug, description: p.description ?? '', category_id: String(p.categories?.category_id ?? ''), brand_id: String(p.brands?.brand_id ?? ''), is_active: p.is_active ?? true })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (modal === 'create') await api.post('/admin/products', form)
      else await api.put(`/admin/products/${editing?.product_id}`, form)
      setModal(null)
      fetchProducts()
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold">Sản phẩm</h1>
        <div className="flex gap-2">
          <div className="flex gap-2">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProducts()} placeholder="Tìm kiếm..." className="input-inset text-sm w-40" />
            <button onClick={fetchProducts} className="btn-ghost py-2 px-3"><Search size={16} /></button>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"><Plus size={16} /> Thêm</button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Sản phẩm', 'Danh mục', 'Thương hiệu', 'Trạng thái', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const variant = Array.isArray(p.product_variants) ? p.product_variants[0] : p.product_variants
                  return (
                    <tr key={p.product_id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.product_images?.[0]?.image_url ? <img src={p.product_images[0].image_url} className="w-10 h-10 rounded object-cover shrink-0" /> : <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: 'var(--surface-raised)' }}>🖱️</div>}
                          <div>
                            <p className="font-medium">{p.name}</p>
                            {variant && <p className="text-xs" style={{ color: 'var(--neon-blue)' }}>{Number(variant.price).toLocaleString('vi-VN')}₫</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{p.categories?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{p.brands?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.is_active ? 'rgba(0,255,157,0.1)' : 'rgba(255,77,106,0.1)', color: p.is_active ? 'var(--success)' : 'var(--error)' }}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <Link to={`/admin/products/${p.product_id}/variants`} title="Quản lý Variants" style={{ color: 'var(--neon-cyan)' }}><Layers size={14} /></Link>
                          <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                          <button onClick={() => handleDelete(p.product_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
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

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary py-1 px-3 text-sm' : 'btn-ghost py-1 px-3 text-sm'}>{p}</button>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-lg mb-4">{modal === 'create' ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                <input value={form.name} onChange={(e) => setSlug(e.target.value)} className="input-inset text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-inset text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-inset text-sm" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Danh mục</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-inset text-sm">
                    <option value="">-- Chọn --</option>
                    {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thương hiệu</label>
                  <select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="input-inset text-sm">
                    <option value="">-- Chọn --</option>
                    {brands.map((b) => <option key={b.brand_id} value={b.brand_id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} />
                <label htmlFor="is_active" className="text-sm">Active</label>
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
