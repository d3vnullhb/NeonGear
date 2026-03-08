import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Truck, Headphones, Mouse, Keyboard, Package } from 'lucide-react'
import api from '../lib/api'
import type { Product, Category } from '../types'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'bàn phím': <Keyboard size={28} />,
  'chuột': <Mouse size={28} />,
  'tai nghe': <Headphones size={28} />,
}
const getCategoryIcon = (name: string) => CATEGORY_ICONS[name.toLowerCase()] ?? <Package size={28} />

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/products?limit=8'),
      api.get('/categories'),
    ]).then(([pRes, cRes]) => {
      setProducts(pRes.data.data ?? [])
      setCategories(cRes.data.data ?? [])
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden hero-grid" style={{ minHeight: 540, background: 'linear-gradient(160deg, #08080f 0%, #0d0d1f 60%, #0a0a12 100%)' }}>
        {/* Glow orbs */}
        <div className="absolute pointer-events-none" style={{ top: '10%', left: '55%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '5%', right: '5%', width: 240, height: 240, background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Text */}
          <div className="flex-1 text-center md:text-left animate-fade-in">
            <div className="inline-flex items-center gap-2 badge mb-5 text-xs py-1.5 px-4">
              <Zap size={11} /> HÀNG MỚI 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 leading-tight">
              Gaming Gear<br />
              <span className="neon-text">Đỉnh Cao</span><br />
              Hiệu Năng
            </h1>
            <p className="text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
              Keyboards, mice, headsets &mdash; tất cả những gì bạn cần để thống trị mọi trận đấu.
            </p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link to="/products" className="btn-primary text-sm px-7 py-3 gap-2">
                Mua ngay <ArrowRight size={16} />
              </Link>
              <Link to="/posts" className="btn-ghost text-sm px-7 py-3">
                Đọc Blog
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex md:flex-col gap-3 md:gap-4 shrink-0">
            {[
              { value: '500+', label: 'Sản phẩm' },
              { value: '10K+', label: 'Khách hàng' },
              { value: '4.9★', label: 'Đánh giá' },
            ].map((s) => (
              <div key={s.label} className="card-raised px-5 py-4 text-center min-w-[100px]" style={{ borderColor: 'rgba(0,180,255,0.15)' }}>
                <p className="text-2xl font-bold neon-text leading-none">{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn từ 500.000₫', color: '#00b4ff' },
              { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Lên đến 24 tháng', color: '#00ff9d' },
              { icon: Zap, title: 'Giao nhanh 2h', desc: 'Nội thành HCM & HN', color: '#ffb800' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex items-center gap-4 p-4 rounded-xl transition-colors" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <h2 className="section-heading">Danh mục</h2>
              <Link to="/products" className="text-sm flex items-center gap-1 transition-colors" style={{ color: 'var(--muted)' }}>
                Tất cả <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.category_id}
                  to={`/products?category_id=${cat.category_id}`}
                  className="card group flex flex-col items-center gap-3 p-5 text-center transition-all duration-200 hover:-translate-y-1"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-110" style={{ background: 'rgba(0,180,255,0.08)', color: 'var(--neon-blue)' }}>
                    {cat.image_url
                      ? <img src={cat.image_url} alt={cat.name} className="w-9 h-9 object-contain" />
                      : getCategoryIcon(cat.name)}
                  </div>
                  <span className="text-sm font-semibold">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ── */}
      <section className="py-14 px-4" style={{ background: 'var(--surface)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <h2 className="section-heading">Sản phẩm nổi bật</h2>
            <Link to="/products" className="text-sm flex items-center gap-1.5 transition-colors" style={{ color: 'var(--neon-blue)' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-20"><Spinner size={44} /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center card p-10 md:p-14 relative overflow-hidden" style={{ borderColor: 'rgba(0,180,255,0.2)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,180,255,0.06) 0%, transparent 70%)' }} />
          <h2 className="text-2xl md:text-3xl font-bold mb-3 relative">Sẵn sàng nâng cấp setup?</h2>
          <p className="mb-7 relative" style={{ color: 'var(--muted)' }}>Khám phá hàng trăm sản phẩm gaming gear chính hãng.</p>
          <Link to="/products" className="btn-primary px-10 py-3 relative">
            Khám phá ngay <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
