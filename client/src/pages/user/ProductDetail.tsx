import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Star, ChevronLeft, ZoomIn, X, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import type { Product, ProductVariant, Review } from '../../types'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'
import ProductCard from '../../components/ProductCard'

interface RecentProduct { product_id: number; name: string; slug: string; price: number; image_url: string | null; brand_name: string | null }

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [related, setRelated] = useState<Product[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentProduct[]>([])

  useEffect(() => {
    if (!slug) return
    api.get(`/products/${slug}`).then((res) => {
      const p: Product = res.data.data
      setProduct(p)
      const variants = Array.isArray(p.product_variants) ? p.product_variants : p.product_variants ? [p.product_variants] : []
      const def = variants.find((v) => v.is_default) ?? variants[0] ?? null
      setSelectedVariant(def)
      setActiveImage(p.product_images?.[0]?.image_url ?? def?.image_url ?? null)
      api.get(`/reviews/product/${p.product_id}`).then((r) => setReviews(r.data.data ?? [])).catch(() => {})
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false))
  }, [slug])

  // allImages must be computed before this callback so the dep is not stale
  const allImages = product ? [...product.product_images, ...(selectedVariant?.product_images ?? [])] : []

  // Close lightbox on Escape, navigate with arrow keys
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!zoomOpen) return
    if (e.key === 'Escape') setZoomOpen(false)
    if (e.key === 'ArrowRight') setZoomIndex((i) => (i + 1) % allImages.length)
    if (e.key === 'ArrowLeft') setZoomIndex((i) => (i - 1 + allImages.length) % allImages.length)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOpen, allImages.length])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = zoomOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [zoomOpen])

  // Recently viewed + related products
  useEffect(() => {
    if (!product) return
    const KEY = 'ng_recent_products'
    try {
      const prev: RecentProduct[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      const entry: RecentProduct = {
        product_id: product.product_id,
        name: product.name,
        slug: product.slug,
        price: selectedVariant ? Number(selectedVariant.price) : 0,
        image_url: product.product_images?.[0]?.image_url ?? selectedVariant?.image_url ?? null,
        brand_name: (product as any).brands?.name ?? null,
      }
      const updated = [entry, ...prev.filter(p => p.product_id !== product.product_id)].slice(0, 8)
      localStorage.setItem(KEY, JSON.stringify(updated))
      setRecentlyViewed(prev.filter(p => p.product_id !== product.product_id).slice(0, 4))
    } catch {}
    const catId = (product as any).categories?.category_id
    if (catId) {
      api.get(`/products?category_id=${catId}&limit=8`)
        .then(r => setRelated((r.data.data ?? []).filter((p: Product) => p.product_id !== product.product_id).slice(0, 4)))
        .catch(() => {})
    }
  }, [product?.product_id])

  const variants = Array.isArray(product?.product_variants) ? product!.product_variants : product?.product_variants ? [product.product_variants] : []
  const price = selectedVariant ? Number(selectedVariant.price) : 0
  const comparePrice = selectedVariant?.compare_price ? Number(selectedVariant.compare_price) : null
  const stock = selectedVariant?.inventory?.quantity ?? 0

  const openZoom = (url: string) => {
    const idx = allImages.findIndex((img) => img.image_url === url)
    setZoomIndex(idx >= 0 ? idx : 0)
    setZoomOpen(true)
  }

  const handleAdd = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (!selectedVariant || !product) return
    setAdding(true)
    try {
      const variantName = selectedVariant.product_attribute_values?.map((a) => a.value).join(' / ')
      await addItem(selectedVariant.variant_id, quantity, {
        name: product.name,
        image_url: activeImage ?? selectedVariant.image_url ?? product.product_images?.[0]?.image_url,
        price: selectedVariant.price,
        variant_name: variantName,
        slug: product.slug,
      })
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!product) return null

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-6 btn-ghost py-2 px-3">
          <ChevronLeft size={16} /> Quay lại
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div>
            {/* Main image */}
            <div className="card mb-3 overflow-hidden aspect-square relative group">
              {activeImage
                ? <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-4" />
                : <div className="w-full h-full flex items-center justify-center text-6xl">🖱️</div>}

              {/* Zoom button — bottom right corner */}
              {activeImage && (
                <button
                  onClick={() => openZoom(activeImage)}
                  title="Phóng to ảnh"
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomIn size={17} />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img) => (
                  <button
                    key={img.image_id}
                    onClick={() => setActiveImage(img.image_url)}
                    style={{
                      border: `2px solid ${activeImage === img.image_url ? 'var(--neon-blue)' : 'var(--border)'}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: 'var(--surface)',
                      cursor: 'pointer',
                      width: 64,
                      height: 64,
                      padding: 0,
                      boxShadow: activeImage === img.image_url ? '0 0 8px rgba(0,180,255,0.4)' : 'none',
                      transition: 'border-color 150ms, box-shadow 150ms',
                    }}
                  >
                    <img src={img.image_url} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brands && <p className="text-sm mb-2 neon-text">{product.brands.name}</p>}
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold neon-text">{price.toLocaleString('vi-VN')}₫</span>
              {comparePrice && comparePrice > price && (
                <>
                  <span className="text-lg line-through" style={{ color: 'var(--muted)' }}>{comparePrice.toLocaleString('vi-VN')}₫</span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,77,106,0.15)', color: 'var(--error)' }}>
                    -{Math.round((1 - price / comparePrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">Phiên bản:</p>
                <div className="flex gap-2 flex-wrap">
                  {variants.map((v) => (
                    <button
                      key={v.variant_id}
                      onClick={() => { setSelectedVariant(v); if (v.image_url) setActiveImage(v.image_url) }}
                      className={selectedVariant?.variant_id === v.variant_id ? 'btn-primary py-1 px-3 text-sm' : 'btn-ghost py-1 px-3 text-sm'}
                    >
                      {v.product_attribute_values?.map((a) => a.value).join(' / ') || v.sku}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <p className="text-sm mb-4" style={{ color: stock > 0 ? 'var(--success)' : 'var(--error)' }}>
              {stock > 0 ? `Còn ${stock} sản phẩm` : 'Hết hàng'}
            </p>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-sm font-semibold">Số lượng:</span>
              <div className="flex items-center" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'var(--surface-raised)', border: 'none', color: 'var(--text)', cursor: 'pointer', width: 36, height: 36 }}>−</button>
                <span style={{ width: 40, textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', lineHeight: '36px', fontSize: 14 }}>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} style={{ background: 'var(--surface-raised)', border: 'none', color: 'var(--text)', cursor: 'pointer', width: 36, height: 36 }} disabled={stock === 0}>+</button>
              </div>
            </div>

            <button onClick={handleAdd} disabled={stock === 0 || adding} className="btn-primary flex items-center gap-2 w-full justify-center py-3">
              <ShoppingCart size={18} />
              {adding ? 'Đang thêm...' : stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>

            {/* Description */}
            {product.description && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="font-semibold mb-3">Mô tả sản phẩm</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          {/* Header + summary */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, marginBottom: 28, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', marginBottom: 4 }}>
                Đánh giá sản phẩm
              </h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{reviews.length} đánh giá</p>
            </div>
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              const dist = [5,4,3,2,1].map(star => ({
                star,
                count: reviews.filter(r => r.rating === star).length,
                pct: Math.round(reviews.filter(r => r.rating === star).length / reviews.length * 100),
              }))
              return (
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {/* Average big */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 20px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 90 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--warning)', lineHeight: 1, fontFamily: 'Space Grotesk' }}>{avg.toFixed(1)}</span>
                    <div style={{ display: 'flex', gap: 2, margin: '6px 0 2px' }}>
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={13} fill={i <= Math.round(avg) ? '#ffb800' : 'none'} style={{ color: '#ffb800' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{reviews.length} đánh giá</span>
                  </div>
                  {/* Distribution bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center' }}>
                    {dist.map(({ star, count, pct }) => (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--muted)', width: 14, textAlign: 'right' }}>{star}</span>
                        <Star size={11} fill="#ffb800" style={{ color: '#ffb800', flexShrink: 0 }} />
                        <div style={{ width: 100, height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct > 0 ? '#ffb800' : 'transparent', borderRadius: 4, transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--muted)', width: 24 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <Star size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              <p style={{ fontSize: 14 }}>Chưa có đánh giá nào.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {reviews.map((r, idx) => {
                const initials = r.users?.full_name?.[0]?.toUpperCase() ?? '?'
                const date = r.created_at ? new Date(r.created_at) : null
                const dateStr = date ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
                return (
                  <div key={r.review_id} style={{
                    padding: '20px 0',
                    borderBottom: idx < reviews.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      {/* Avatar */}
                      {r.users?.avatar_url
                        ? <img src={r.users.avatar_url} alt={r.users.full_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,180,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--neon-blue)', flexShrink: 0 }}>{initials}</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + stars + date row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.users?.full_name}</p>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {[1,2,3,4,5].map(i => (
                                <Star key={i} size={13} fill={i <= r.rating ? '#ffb800' : 'none'} style={{ color: i <= r.rating ? '#ffb800' : 'var(--border)' }} />
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            {dateStr && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{dateStr}</span>}
                            {r.order_id && (
                              <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,255,157,0.1)', color: 'var(--success)', border: '1px solid rgba(0,255,157,0.2)', fontWeight: 600 }}>
                                Đã mua hàng
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Comment */}
                        {r.comment && (
                          <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, marginTop: 4 }}>{r.comment}</p>
                        )}
                        {/* Review images */}
                        {r.review_images && r.review_images.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            {r.review_images.map((img: any) => (
                              <img key={img.image_id} src={img.image_url} alt={img.alt_text ?? ''} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', marginBottom: 20 }}>Sản phẩm liên quan</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {related.map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
          </div>
        )}

        {/* ── Recently viewed ── */}
        {recentlyViewed.length > 0 && (
          <div style={{ marginTop: '2.5rem', paddingTop: '2rem', paddingBottom: '3rem', borderTop: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', marginBottom: 20 }}>Đã xem gần đây</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {recentlyViewed.map(p => (
                <Link key={p.product_id} to={`/products/${p.slug}`} className="card" style={{ width: 160, flexShrink: 0, textDecoration: 'none', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'transform 200ms' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', borderRadius: 8, background: 'var(--surface-raised)' }} />
                    : <div style={{ width: '100%', aspectRatio: '1', background: 'var(--surface-raised)', borderRadius: 8 }} />}
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{p.name}</p>
                  {p.brand_name && <p style={{ fontSize: 12, color: 'var(--neon-blue)' }}>{p.brand_name}</p>}
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--neon-blue)' }}>{p.price.toLocaleString('vi-VN')}₫</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {zoomOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={() => setZoomOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center z-10"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>

          {/* Prev button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setZoomIndex((i) => (i - 1 + allImages.length) % allImages.length) }}
              className="absolute left-4 w-10 h-10 rounded-xl flex items-center justify-center z-10"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[zoomIndex]?.image_url}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setZoomIndex((i) => (i + 1) % allImages.length) }}
              className="absolute right-4 w-10 h-10 rounded-xl flex items-center justify-center z-10"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer' }}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)' }}>
              {zoomIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
