import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import api from '../../lib/api'
import type { WishlistItem } from '../../types'
import Spinner from '../../components/Spinner'
import { useWishlist } from '../../context/WishlistContext'

export default function Wishlist() {
  const { toggle } = useWishlist()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchWishlist = () => {
    api.get('/wishlist').then((res) => setItems(res.data.data ?? [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchWishlist() }, [])

  const remove = async (item: WishlistItem) => {
    await toggle(item.product_id, item.variant_id ?? undefined)
    setItems((prev) => prev.filter((i) => i.wishlist_id !== item.wishlist_id))
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Danh sách yêu thích ({items.length})</h1>
      {items.length === 0
        ? (
          <div className="text-center py-20">
            <Heart size={64} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <p style={{ color: 'var(--muted)' }}>Chưa có sản phẩm yêu thích</p>
            <Link to="/products" className="btn-primary inline-flex mt-4">Khám phá ngay</Link>
          </div>
        )
        : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const img = item.products?.product_images?.[0]?.image_url
              return (
                <div key={item.wishlist_id} className="card overflow-hidden group">
                  <div className="relative">
                    <Link to={`/products/${item.products?.slug}`}>
                      {img
                        ? <img src={img} alt={item.products?.name} className="w-full aspect-square object-cover" />
                        : <div className="w-full aspect-square flex items-center justify-center text-4xl" style={{ background: 'var(--surface-raised)' }}>🖱️</div>}
                    </Link>
                    <button onClick={() => remove(item)} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-opacity" style={{ background: 'rgba(255,77,106,0.15)', border: 'none', cursor: 'pointer', color: 'var(--error)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="p-3">
                    <Link to={`/products/${item.products?.slug}`} className="font-medium text-sm hover:text-[var(--neon-blue)] transition-colors line-clamp-2">
                      {item.products?.name}
                    </Link>
                    {item.product_variants && (
                      <p className="font-bold text-sm mt-1 neon-text">{Number(item.product_variants.price).toLocaleString('vi-VN')}₫</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </div>
  )
}
