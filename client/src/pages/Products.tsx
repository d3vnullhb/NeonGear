import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import type { Product, Category, Brand, Pagination } from '../types'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { SlidersHorizontal, X } from 'lucide-react'

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  const page = parseInt(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''
  const category_id = searchParams.get('category_id') ?? ''
  const brand_id = searchParams.get('brand_id') ?? ''

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setCategories(c.data.data ?? [])
      setBrands(b.data.data ?? [])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '12')
    if (search) params.set('search', search)
    if (category_id) params.set('category_id', category_id)
    if (brand_id) params.set('brand_id', brand_id)

    api.get(`/products?${params}`).then((res) => {
      setProducts(res.data.data ?? [])
      setPagination(res.data.pagination ?? null)
    }).finally(() => setLoading(false))
  }, [page, search, category_id, brand_id])

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3 text-sm">Danh mục</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={!category_id} onChange={() => setParam('category_id', '')} style={{ accentColor: 'var(--neon-blue)' }} />
            <span>Tất cả</span>
          </label>
          {categories.map((c) => (
            <label key={c.category_id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={category_id === String(c.category_id)} onChange={() => setParam('category_id', String(c.category_id))} style={{ accentColor: 'var(--neon-blue)' }} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-3 text-sm">Thương hiệu</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={!brand_id} onChange={() => setParam('brand_id', '')} style={{ accentColor: 'var(--neon-blue)' }} />
            <span>Tất cả</span>
          </label>
          {brands.map((b) => (
            <label key={b.brand_id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="radio" checked={brand_id === String(b.brand_id)} onChange={() => setParam('brand_id', String(b.brand_id))} style={{ accentColor: 'var(--neon-blue)' }} />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          {search && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Kết quả tìm kiếm: "{search}"</p>}
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="btn-ghost flex items-center gap-2 md:hidden">
          <SlidersHorizontal size={16} /> Bộ lọc
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop filter */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="card p-4 sticky top-20"><Filters /></div>
        </aside>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="w-72 card p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Bộ lọc</h3>
                <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <Filters />
            </div>
            <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setFilterOpen(false)} />
          </div>
        )}

        {/* Products */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={40} /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'var(--muted)' }}>Không tìm thấy sản phẩm</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setParam('page', String(p))}
                      className={p === page ? 'btn-primary py-2 px-4' : 'btn-ghost py-2 px-4'}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
