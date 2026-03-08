import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, Star, ChevronLeft } from 'lucide-react'
import api from '../lib/api'
import type { Product, ProductVariant, Review } from '../types'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

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

  useEffect(() => {
    if (!slug) return
    api.get(`/products/${slug}`).then((res) => {
      const p: Product = res.data.data
      setProduct(p)
      const variants = Array.isArray(p.product_variants) ? p.product_variants : p.product_variants ? [p.product_variants] : []
      const def = variants.find((v) => v.is_default) ?? variants[0] ?? null
      setSelectedVariant(def)
      setActiveImage(p.product_images?.[0]?.image_url ?? def?.image_url ?? null)
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false))

    api.get(`/reviews/product/${slug?.split('-').pop()}`).then((res) => setReviews(res.data.data ?? [])).catch(() => {})
  }, [slug])

  const variants = Array.isArray(product?.product_variants) ? product!.product_variants : product?.product_variants ? [product.product_variants] : []
  const price = selectedVariant ? Number(selectedVariant.price) : 0
  const comparePrice = selectedVariant?.compare_price ? Number(selectedVariant.compare_price) : null
  const stock = selectedVariant?.inventory?.quantity ?? 0

  const handleAdd = async () => {
    if (!selectedVariant || !isAuthenticated) return
    setAdding(true)
    try {
      await addItem(selectedVariant.variant_id, quantity)
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!product) return null

  const allImages = [...product.product_images, ...(selectedVariant?.product_images ?? [])]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm mb-6 btn-ghost py-2 px-3">
        <ChevronLeft size={16} /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="card mb-3 overflow-hidden aspect-square">
            {activeImage
              ? <img src={activeImage} alt={product.name} className="w-full h-full object-contain p-4" />
              : <div className="w-full h-full flex items-center justify-center text-6xl">🖱️</div>}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img) => (
                <button key={img.image_id} onClick={() => setActiveImage(img.image_url)} style={{ border: `2px solid ${activeImage === img.image_url ? 'var(--neon-blue)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--surface)', cursor: 'pointer', width: 64, height: 64, padding: 0 }}>
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
              <span className="text-lg line-through" style={{ color: 'var(--muted)' }}>{comparePrice.toLocaleString('vi-VN')}₫</span>
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
            <div className="flex items-center gap-0" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ background: 'var(--surface-raised)', border: 'none', color: 'var(--text)', cursor: 'pointer', width: 36, height: 36 }}>−</button>
              <span style={{ width: 40, textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', lineHeight: '36px', fontSize: 14 }}>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} style={{ background: 'var(--surface-raised)', border: 'none', color: 'var(--text)', cursor: 'pointer', width: 36, height: 36 }}>+</button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={stock === 0 || !isAuthenticated || adding} className="btn-primary flex items-center gap-2 flex-1">
              <ShoppingCart size={18} />
              {adding ? 'Đang thêm...' : stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
            </button>
          </div>

          {!isAuthenticated && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Đăng nhập để mua hàng</p>}

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
                      : <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--surface-raised)' }}>{r.users?.full_name[0]}</div>}
                    <div>
                      <p className="text-sm font-semibold">{r.users?.full_name}</p>
                      <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? 'var(--warning)' : 'none'} style={{ color: 'var(--warning)' }} />)}</div>
                    </div>
                  </div>
                  {r.comment && <p className="text-sm" style={{ color: 'var(--muted)' }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
