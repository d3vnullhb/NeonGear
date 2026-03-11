import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Star, ChevronLeft, ZoomIn, X, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import type { Product, ProductVariant, Review } from '../../types'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/Spinner'

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
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
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
        <div>
          <h2 className="text-xl font-bold mb-4">Đánh giá ({reviews.length})</h2>
          {reviews.length === 0
            ? <p style={{ color: 'var(--muted)' }}>Chưa có đánh giá nào.</p>
            : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.review_id} className="card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {r.users?.avatar_url
                        ? <img src={r.users.avatar_url} className="w-8 h-8 rounded-full object-cover" />
                        : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--surface-raised)' }}>{r.users?.full_name?.[0]}</div>}
                      <div>
                        <p className="text-sm font-semibold">{r.users?.full_name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--warning)' : 'none'} style={{ color: 'var(--warning)' }} />)}
                        </div>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm" style={{ color: 'var(--muted)' }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
        </div>
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
