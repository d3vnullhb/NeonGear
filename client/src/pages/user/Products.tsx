import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import type { Product, Category, Brand, Pagination } from '../../types'
import ProductCard from '../../components/ProductCard'
import Spinner from '../../components/Spinner'

interface FilterPanelProps {
  categories: Category[]
  brands: Brand[]
  category_id: string
  brand_id: string
  onChange: (key: 'category_id' | 'brand_id', value: string) => void
}

function FilterPanel({ categories, brands, category_id, brand_id, onChange }: FilterPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text)' }}>Danh mục</h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm py-1.5 px-2 rounded-lg transition-colors" style={{ background: !category_id ? 'rgba(0,180,255,0.1)' : 'transparent', color: !category_id ? 'var(--neon-blue)' : 'var(--muted)' }}>
            <input type="radio" name="category" checked={!category_id} onChange={() => onChange('category_id', '')} style={{ accentColor: 'var(--neon-blue)' }} />
            <span>Tất cả</span>
          </label>
          {categories.map((c) => (
            <label key={c.category_id} className="flex items-center gap-2 cursor-pointer text-sm py-1.5 px-2 rounded-lg transition-colors" style={{ background: category_id === String(c.category_id) ? 'rgba(0,180,255,0.1)' : 'transparent', color: category_id === String(c.category_id) ? 'var(--neon-blue)' : 'var(--muted)' }}>
              <input type="radio" name="category" checked={category_id === String(c.category_id)} onChange={() => onChange('category_id', String(c.category_id))} style={{ accentColor: 'var(--neon-blue)' }} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      <div>
        <h4 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text)' }}>Thương hiệu</h4>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer text-sm py-1.5 px-2 rounded-lg transition-colors" style={{ background: !brand_id ? 'rgba(0,180,255,0.1)' : 'transparent', color: !brand_id ? 'var(--neon-blue)' : 'var(--muted)' }}>
            <input type="radio" name="brand" checked={!brand_id} onChange={() => onChange('brand_id', '')} style={{ accentColor: 'var(--neon-blue)' }} />
            <span>Tất cả</span>
          </label>
          {brands.map((b) => (
            <label key={b.brand_id} className="flex items-center gap-2 cursor-pointer text-sm py-1.5 px-2 rounded-lg transition-colors" style={{ background: brand_id === String(b.brand_id) ? 'rgba(0,180,255,0.1)' : 'transparent', color: brand_id === String(b.brand_id) ? 'var(--neon-blue)' : 'var(--muted)' }}>
              <input type="radio" name="brand" checked={brand_id === String(b.brand_id)} onChange={() => onChange('brand_id', String(b.brand_id))} style={{ accentColor: 'var(--neon-blue)' }} />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Pagination({ pagination, page, onPage }: { pagination: Pagination; page: number; onPage: (p: number) => void }) {
  const { totalPages } = pagination
  if (totalPages <= 1) return null

  // Build page range: always show first, last, current ±2
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex justify-center items-center gap-1 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="btn-ghost py-2 px-3"
        style={{ opacity: page === 1 ? 0.4 : 1 }}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...'
          ? <span key={`dot-${i}`} className="px-2" style={{ color: 'var(--muted)' }}>…</span>
          : <button
              key={p}
              onClick={() => onPage(p as number)}
              className={p === page ? 'btn-primary py-2 px-4' : 'btn-ghost py-2 px-4'}
            >
              {p}
            </button>
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="btn-ghost py-2 px-3"
        style={{ opacity: page === totalPages ? 0.4 : 1 }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

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
  const activeFilterCount = (category_id ? 1 : 0) + (brand_id ? 1 : 0)

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

  const handleFilterChange = (key: 'category_id' | 'brand_id', value: string) => {
    setParam(key, value)
    setFilterOpen(false) // auto-close on mobile
  }

  const clearFilters = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('category_id')
    next.delete('brand_id')
    next.delete('page')
    setSearchParams(next)
    setFilterOpen(false)
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          {search && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Kết quả cho: "<span style={{ color: 'var(--text)' }}>{search}</span>"</p>}
          {pagination && <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{pagination.total} sản phẩm</p>}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs btn-ghost py-1.5 px-3" style={{ color: 'var(--error)' }}>
              Xóa lọc
            </button>
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className="btn-ghost flex items-center gap-2 relative"
          >
            <SlidersHorizontal size={16} />
            Bộ lọc
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: 'var(--neon-blue)', color: '#000' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-6 w-full">
        {/* Desktop sidebar filter */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="card p-4 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Xóa tất cả
                </button>
              )}
            </div>
            <FilterPanel
              categories={categories}
              brands={brands}
              category_id={category_id}
              brand_id={brand_id}
              onChange={handleFilterChange}
            />
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="w-72 flex flex-col" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="font-bold">Bộ lọc</h3>
                <button onClick={() => setFilterOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterPanel
                  categories={categories}
                  brands={brands}
                  category_id={category_id}
                  brand_id={brand_id}
                  onChange={handleFilterChange}
                />
              </div>
              {activeFilterCount > 0 && (
                <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button onClick={clearFilters} className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.3)', cursor: 'pointer' }}>
                    Xóa bộ lọc ({activeFilterCount})
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setFilterOpen(false)} />
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Active filters chips (desktop) */}
          {activeFilterCount > 0 && (
            <div className="hidden md:flex items-center gap-2 mb-4 flex-wrap">
              {category_id && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,180,255,0.12)', color: 'var(--neon-blue)', border: '1px solid rgba(0,180,255,0.3)' }}>
                  {categories.find((c) => String(c.category_id) === category_id)?.name}
                  <button onClick={() => setParam('category_id', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                    <X size={12} />
                  </button>
                </span>
              )}
              {brand_id && (
                <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,180,255,0.12)', color: 'var(--neon-blue)', border: '1px solid rgba(0,180,255,0.3)' }}>
                  {brands.find((b) => String(b.brand_id) === brand_id)?.name}
                  <button onClick={() => setParam('brand_id', '')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={40} /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <p style={{ color: 'var(--muted)' }}>Không tìm thấy sản phẩm phù hợp</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-ghost text-sm py-2 px-4">Xóa bộ lọc</button>
              )}
            </div>
          ) : (
            <>
              <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
              </div>

              {pagination && (
                <Pagination
                  pagination={pagination}
                  page={page}
                  onPage={(p) => setParam('page', String(p))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
