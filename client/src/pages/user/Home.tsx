import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Truck, Headphones, Mouse, Keyboard, Package } from 'lucide-react'
import api from '../../lib/api'
import type { Product, Category } from '../../types'
import ProductCard from '../../components/ProductCard'
import Spinner from '../../components/Spinner'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'bàn phím': <Keyboard size={28} />,
  'chuột': <Mouse size={28} />,
  'tai nghe': <Headphones size={28} />,
}
const getCategoryIcon = (name: string) => CATEGORY_ICONS[name.toLowerCase()] ?? <Package size={28} />

const container: React.CSSProperties = {
  maxWidth: '80rem',
  margin: '0 auto',
  paddingLeft: '1.5rem',
  paddingRight: '1.5rem',
}

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
      <section className="hero-grid" style={{
        minHeight: 540,
        background: 'linear-gradient(160deg, #08080f 0%, #0d0d1f 60%, #0a0a12 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '55%', width: 480, height: 480, background: 'radial-gradient(circle, rgba(0,180,255,0.12) 0%, transparent 70%)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: 240, height: 240, background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          ...container,
          paddingTop: '4rem',
          paddingBottom: '4rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '2.5rem',
          position: 'relative',
        }}>
          {/* Text */}
          <div className="animate-fade-in" style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, padding: '6px 16px' }}>
              <Zap size={11} /> HÀNG MỚI 2026
            </div>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, marginBottom: 20, lineHeight: 1.2 }}>
              Gaming Gear<br />
              <span className="neon-text">Đỉnh Cao</span><br />
              Hiệu Năng
            </h1>
            <p style={{ fontSize: '1rem', marginBottom: 32, maxWidth: 420, color: 'var(--muted)', lineHeight: 1.7 }}>
              Keyboards, mice, headsets — tất cả những gì bạn cần để thống trị mọi trận đấu.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products" className="btn-primary" style={{ fontSize: 14, padding: '10px 28px', gap: 8, display: 'inline-flex', alignItems: 'center' }}>
                Mua ngay <ArrowRight size={16} />
              </Link>
              <Link to="/posts" className="btn-ghost" style={{ fontSize: 14, padding: '10px 28px' }}>
                Đọc Blog
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
            {[
              { value: '150+', label: 'Sản phẩm' },
              { value: '2K+', label: 'Khách hàng' },
              { value: '4.9★', label: 'Đánh giá' },
            ].map((s) => (
              <div key={s.label} className="card-raised" style={{ padding: '16px 20px', textAlign: 'center', minWidth: 100, borderColor: 'rgba(0,180,255,0.15)' }}>
                <p className="neon-text" style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 12, marginTop: 4, color: 'var(--muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...container, paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn từ 500.000₫', color: '#00b4ff' },
              { icon: Shield, title: 'Bảo hành chính hãng', desc: 'Lên đến 24 tháng', color: '#00ff9d' },
              { icon: Zap, title: 'Giao nhanh 2h', desc: 'Nội thành HCM & HN', color: '#ffb800' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${color}18` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{title}</p>
                  <p style={{ fontSize: 12, marginTop: 2, color: 'var(--muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section style={{ padding: '3.5rem 0' }}>
          <div style={container}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
              <h2 className="section-heading">Danh mục</h2>
              <Link to="/products" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', textDecoration: 'none' }}>
                Tất cả <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.category_id}
                  to={`/products?category_id=${cat.category_id}`}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20, textAlign: 'center', textDecoration: 'none', transition: 'transform 0.2s', borderColor: 'var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,180,255,0.08)', color: 'var(--neon-blue)' }}>
                    {cat.image_url
                      ? <img src={cat.image_url} alt={cat.name} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                      : getCategoryIcon(cat.name)}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured products ── */}
      <section style={{ padding: '3.5rem 0', background: 'var(--surface)' }}>
        <div style={container}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
            <h2 className="section-heading">Sản phẩm nổi bật</h2>
            <Link to="/products" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--neon-blue)', textDecoration: 'none' }}>
              Xem tất cả <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}><Spinner size={44} /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {products.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div className="card" style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center', padding: '3.5rem 2rem', position: 'relative', overflow: 'hidden', borderColor: 'rgba(0,180,255,0.2)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,180,255,0.06) 0%, transparent 70%)' }} />
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.875rem)', fontWeight: 700, marginBottom: 12, position: 'relative' }}>Sẵn sàng nâng cấp setup?</h2>
          <p style={{ marginBottom: 28, color: 'var(--muted)', position: 'relative' }}>Khám phá hàng trăm sản phẩm gaming gear chính hãng.</p>
          <Link to="/products" className="btn-primary" style={{ padding: '12px 40px', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Khám phá ngay <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  )
}