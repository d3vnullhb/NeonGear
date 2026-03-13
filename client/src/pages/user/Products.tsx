import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import type { Product, Category, Brand, Pagination } from '../../types'
import ProductCard from '../../components/ProductCard'
import Spinner from '../../components/Spinner'

interface AttrOption { attribute_id: number; name: string; values: string[] }

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Nổi bật' },
  { value: 'price_asc',  label: 'Giá (từ thấp đến cao)' },
  { value: 'price_desc', label: 'Giá (từ cao xuống thấp)' },
  { value: 'name_asc',   label: 'Tên (A → Z)' },
  { value: 'name_desc',  label: 'Tên (Z → A)' },
  { value: 'oldest',     label: 'Ngày (cũ → mới)' },
]

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontWeight: 600, fontSize: 14 }}
      >
        {title}
        {open ? <ChevronUp size={15} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--muted)' }} />}
      </button>
      {open && <div style={{ paddingBottom: 12 }}>{children}</div>}
    </div>
  )
}

function PaginationBar({ pagination, page, onPage }: { pagination: Pagination; page: number; onPage: (p: number) => void }) {
  const { totalPages } = pagination
  if (totalPages <= 1) return null
  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn-ghost" style={{ padding: '8px 12px', opacity: page === 1 ? 0.4 : 1 }}>
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '...'
          ? <span key={`d${i}`} style={{ color: 'var(--muted)', padding: '0 4px' }}>…</span>
          : <button key={p} onClick={() => onPage(p as number)} className={p === page ? 'btn-primary' : 'btn-ghost'} style={{ padding: '8px 14px' }}>{p}</button>
      )}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="btn-ghost" style={{ padding: '8px 12px', opacity: page === totalPages ? 0.4 : 1 }}>
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
  const [filterAttributes, setFilterAttributes] = useState<AttrOption[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const page        = parseInt(searchParams.get('page') ?? '1')
  const search      = searchParams.get('search') ?? ''
  const category_id = searchParams.get('category_id') ?? ''
  const brand_id    = searchParams.get('brand_id') ?? ''
  const sort        = searchParams.get('sort') ?? 'newest'
  const in_stock    = searchParams.get('in_stock') === 'true'
  const min_price   = searchParams.get('min_price') ?? ''
  const max_price   = searchParams.get('max_price') ?? ''

  const attrFilters: Record<number, string[]> = {}
  searchParams.forEach((val, key) => {
    if (key.startsWith('attr_')) {
      const id = parseInt(key.replace('attr_', ''))
      if (!isNaN(id)) attrFilters[id] = val.split(',')
    }
  })

  const activeFilterCount =
    (category_id ? 1 : 0) + (brand_id ? 1 : 0) + (in_stock ? 1 : 0) +
    (min_price || max_price ? 1 : 0) + Object.keys(attrFilters).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/brands')]).then(([c, b]) => {
      setCategories(c.data.data ?? [])
      setBrands(b.data.data ?? [])
    })
  }, [])

  useEffect(() => {
    const q = category_id ? `?category_id=${category_id}` : ''
    api.get(`/products/filter-options${q}`).then(r => setFilterAttributes(r.data.data ?? [])).catch(() => {})
  }, [category_id])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '12')
    if (search) params.set('search', search)
    if (category_id) params.set('category_id', category_id)
    if (brand_id) params.set('brand_id', brand_id)
    if (sort && sort !== 'newest') params.set('sort', sort)
    if (in_stock) params.set('in_stock', 'true')
    if (min_price) params.set('min_price', min_price)
    if (max_price) params.set('max_price', max_price)
    Object.entries(attrFilters).forEach(([id, vals]) => { if (vals.length) params.set(`attr_${id}`, vals.join(',')) })
    api.get(`/products?${params}`).then(res => {
      setProducts(res.data.data ?? [])
      setPagination(res.data.pagination ?? null)
    }).finally(() => setLoading(false))
  }, [searchParams])

  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    })
    setSearchParams(next)
  }

  const toggleAttr = (attrId: number, value: string) => {
    const current = attrFilters[attrId] ?? []
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    setParam({ [`attr_${attrId}`]: next.length ? next.join(',') : null })
  }

  const clearAllFilters = () => {
    const next = new URLSearchParams()
    if (search) next.set('search', search)
    if (sort && sort !== 'newest') next.set('sort', sort)
    setSearchParams(next)
    setFilterOpen(false)
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Nổi bật'

  const FilterContent = (
    <div>
      {/* In stock toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Còn hàng</span>
        <button
          onClick={() => setParam({ in_stock: in_stock ? null : 'true' })}
          style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', padding: 2, background: in_stock ? 'var(--neon-blue)' : 'var(--surface-raised)', transition: 'background 200ms', position: 'relative', flexShrink: 0 }}
        >
          <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: in_stock ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 200ms' }} />
        </button>
      </div>

      {/* Category */}
      <Accordion title="Danh mục" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: '', name: 'Tất cả' }, ...categories.map(c => ({ id: String(c.category_id), name: c.name }))].map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 6px', borderRadius: 8, background: category_id === c.id ? 'rgba(0,180,255,0.1)' : 'transparent' }}>
              <input type="radio" name="cat" checked={category_id === c.id} onChange={() => setParam({ category_id: c.id || null })} style={{ accentColor: 'var(--neon-blue)', width: 14, height: 14 }} />
              <span style={{ fontSize: 13, color: category_id === c.id ? 'var(--neon-blue)' : 'var(--muted)' }}>{c.name}</span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* Brand */}
      <Accordion title="Thương hiệu" defaultOpen>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[{ id: '', name: 'Tất cả' }, ...brands.map(b => ({ id: String(b.brand_id), name: b.name }))].map(b => (
            <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 6px', borderRadius: 8, background: brand_id === b.id ? 'rgba(0,180,255,0.1)' : 'transparent' }}>
              <input type="radio" name="brd" checked={brand_id === b.id} onChange={() => setParam({ brand_id: b.id || null })} style={{ accentColor: 'var(--neon-blue)', width: 14, height: 14 }} />
              <span style={{ fontSize: 13, color: brand_id === b.id ? 'var(--neon-blue)' : 'var(--muted)' }}>{b.name}</span>
            </label>
          ))}
        </div>
      </Accordion>

      {/* Price range */}
      <Accordion title="Giá">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" placeholder="Từ" value={min_price} onChange={e => setParam({ min_price: e.target.value || null })}
            className="input-inset" style={{ flex: 1, padding: '7px 10px', fontSize: 13 }} />
          <span style={{ color: 'var(--muted)', fontSize: 13, flexShrink: 0 }}>–</span>
          <input type="number" placeholder="Đến" value={max_price} onChange={e => setParam({ max_price: e.target.value || null })}
            className="input-inset" style={{ flex: 1, padding: '7px 10px', fontSize: 13 }} />
        </div>
      </Accordion>

      {/* Dynamic attributes */}
      {filterAttributes.map(attr => (
        <Accordion key={attr.attribute_id} title={attr.name}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {attr.values.map(val => {
              const checked = (attrFilters[attr.attribute_id] ?? []).includes(val)
              return (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 6px', borderRadius: 8, background: checked ? 'rgba(0,180,255,0.08)' : 'transparent' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleAttr(attr.attribute_id, val)}
                    style={{ accentColor: 'var(--neon-blue)', width: 14, height: 14 }} />
                  <span style={{ fontSize: 13, color: checked ? 'var(--neon-blue)' : 'var(--muted)' }}>{val}</span>
                </label>
              )
            })}
          </div>
        </Accordion>
      ))}
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto" style={{ padding: '2rem 1.5rem 4rem' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.5rem' }}>
            {search ? `Kết quả: "${search}"` : 'Sản phẩm'}
          </h1>
          {pagination && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{pagination.total} sản phẩm</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Mobile filter toggle */}
          <button onClick={() => setFilterOpen(true)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', fontSize: 14 }}>
            <SlidersHorizontal size={15} /> Bộ lọc
            {activeFilterCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--neon-blue)', color: '#000', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setSortOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
            >
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>Sắp xếp:</span>
              <span style={{ fontWeight: 600 }}>{currentSortLabel}</span>
              {sortOpen ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />}
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, zIndex: 40, minWidth: 230, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setParam({ sort: opt.value === 'newest' ? null : opt.value }); setSortOpen(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: sort === opt.value ? 'rgba(0,180,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: sort === opt.value ? 'var(--neon-blue)' : 'var(--text)', fontWeight: sort === opt.value ? 600 : 400, transition: 'background 150ms' }}
                    onMouseEnter={e => { if (sort !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (sort !== opt.value) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Desktop sidebar */}
        <aside className="products-sidebar">
          <div className="card" style={{ padding: '16px 18px', position: 'sticky', top: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  Xóa tất cả
                </button>
              )}
            </div>
            {FilterContent}
          </div>
        </aside>

        {/* Mobile drawer */}
        {filterOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setFilterOpen(false)} />
            <div style={{ position: 'relative', zIndex: 1, background: 'var(--surface)', width: 300, maxWidth: '85vw', height: '100%', overflowY: 'auto', padding: '20px 16px', boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Bộ lọc</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {activeFilterCount > 0 && (
                    <button onClick={clearAllFilters} style={{ fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Xóa tất cả</button>
                  )}
                  <button onClick={() => setFilterOpen(false)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--text)', display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>
              </div>
              {FilterContent}
              <button onClick={() => setFilterOpen(false)} className="btn-primary" style={{ width: '100%', marginTop: 20 }}>
                Xem {pagination ? `${pagination.total} ` : ''}kết quả
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}><Spinner size={40} /></div>
          ) : products.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <p style={{ fontSize: 16 }}>Không tìm thấy sản phẩm nào.</p>
              {activeFilterCount > 0 && <button onClick={clearAllFilters} className="btn-ghost" style={{ marginTop: 16, fontSize: 14 }}>Xóa bộ lọc</button>}
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {products.map(p => <ProductCard key={p.product_id} product={p} />)}
              </div>
              {pagination && <PaginationBar pagination={pagination} page={page} onPage={p => setParam({ page: String(p) })} />}
            </>
          )}
        </div>
      </div>

      <style>{`.products-sidebar { display: none; width: 220px; flex-shrink: 0; } @media (min-width: 768px) { .products-sidebar { display: block; } }`}</style>
    </div>
  )
}
