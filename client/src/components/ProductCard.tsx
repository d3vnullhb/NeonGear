import { Link } from 'react-router-dom'
import { ShoppingCart, Heart } from 'lucide-react'
import type { Product } from '../types'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useWishlist } from '../context/WishlistContext'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart()
  const { isAuthenticated } = useAuth()
  const { isWishlisted, toggle } = useWishlist()

  const variant = Array.isArray(product.product_variants)
    ? product.product_variants.find((v) => v.is_default) ?? product.product_variants[0]
    : product.product_variants

  const mainImage = product.product_images?.find((img) => img.is_main) ?? product.product_images?.[0]
  const price = variant ? Number(variant.price) : 0
  const comparePrice = variant?.compare_price ? Number(variant.compare_price) : null
  const inStock = (variant?.inventory?.quantity ?? 0) > 0
  const wishlisted = isWishlisted(product.product_id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !variant) return
    try {
      await addItem(variant.variant_id, 1)
    } catch {
      // silent
    }
  }

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) return
    try {
      await toggle(product.product_id, variant?.variant_id)
    } catch {
      // silent
    }
  }

  return (
    <Link to={`/products/${product.slug}`} className="group block card overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: '6px 6px 12px #06060c, -6px -6px 12px #1e1e2e' }}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden" style={{ background: 'var(--surface-raised)' }}>
        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={mainImage.alt_text || product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🖱️</div>
        )}
        {comparePrice && comparePrice > price && (
          <span className="absolute top-2 left-2 badge" style={{ background: 'var(--error)', color: '#fff' }}>
            -{Math.round((1 - price / comparePrice) * 100)}%
          </span>
        )}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(10,10,15,0.7)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Hết hàng</span>
          </div>
        )}
        {/* Heart button */}
        {isAuthenticated && (
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: wishlisted ? 'rgba(255,77,106,0.2)' : 'rgba(10,10,15,0.6)',
              border: wishlisted ? '1px solid rgba(255,77,106,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: wishlisted ? '#ff4d6a' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
            }}
          >
            <Heart size={14} fill={wishlisted ? '#ff4d6a' : 'none'} />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        {product.brands && <p className="text-xs mb-1" style={{ color: 'var(--neon-blue)' }}>{product.brands.name}</p>}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-snug">{product.name}</h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold neon-text">{price.toLocaleString('vi-VN')}₫</span>
          {comparePrice && comparePrice > price && (
            <span className="text-xs line-through" style={{ color: 'var(--muted)' }}>{comparePrice.toLocaleString('vi-VN')}₫</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!inStock || !isAuthenticated}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
        >
          <ShoppingCart size={14} />
          {inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
        </button>
      </div>
    </Link>
  )
}
