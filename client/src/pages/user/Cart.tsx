import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import Spinner from '../../components/Spinner'
import { calcShippingFee } from '../../lib/shipping'

export default function Cart() {
  const { cart, loading, cartError, updateItem, removeItem, clearCart } = useCart()
  const navigate = useNavigate()
  const [mutError, setMutError] = useState('')

  const onUpdateItem = async (id: number, qty: number) => {
    try { setMutError(''); await updateItem(id, qty) }
    catch { setMutError('Không thể cập nhật số lượng, vui lòng thử lại') }
  }
  const onRemoveItem = async (id: number) => {
    try { setMutError(''); await removeItem(id) }
    catch { setMutError('Không thể xoá sản phẩm, vui lòng thử lại') }
  }
  const onClearCart = async () => {
    try { setMutError(''); await clearCart() }
    catch { setMutError('Không thể xoá giỏ hàng, vui lòng thử lại') }
  }

  const total = cart?.cart_items.reduce((sum, item) => sum + Number(item.product_variants?.price ?? 0) * item.quantity, 0) ?? 0
  const shipping_fee = calcShippingFee(total, 'standard')
  const hasOutOfStock = cart?.cart_items.some((item) => Number(item.product_variants?.inventory?.quantity ?? 0) === 0) ?? false

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>

  if (cartError) return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
      <ShoppingBag size={64} className="mx-auto mb-4" style={{ color: 'var(--error)' }} />
      <p className="mb-2" style={{ color: 'var(--error)' }}>{cartError}</p>
      <button onClick={() => window.location.reload()} className="btn-primary inline-flex mt-4">Thử lại</button>
    </div>
  )

  if (!cart || !cart.cart_items.length) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
        <h2 className="text-2xl font-bold mb-2">Giỏ hàng trống</h2>
        <p className="mb-6" style={{ color: 'var(--muted)' }}>Hãy thêm sản phẩm vào giỏ hàng</p>
        <Link to="/products" className="btn-primary inline-flex">Mua sắm ngay</Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng ({cart.cart_items.length})</h1>

      {mutError && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', color: 'var(--error)' }}>
          {mutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.cart_items.map((item) => {
            const product = item.product_variants?.products
            const variant = item.product_variants
            const price = Number(variant?.price ?? 0)
            const attrs = variant?.product_attribute_values?.map((a) => a.value).join(' / ')
            const stock = Number(variant?.inventory?.quantity ?? 0)

            return (
              <div key={item.id} className="card p-4 flex gap-4">
                {variant?.image_url
                  ? <img src={variant.image_url} alt={product?.name} className="w-20 h-20 object-cover rounded-lg shrink-0" />
                  : <div className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center text-3xl" style={{ background: 'var(--surface-raised)' }}>🖱️</div>}

                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product?.slug}`} className="font-semibold text-sm hover:text-[var(--neon-blue)] transition-colors line-clamp-1">{product?.name}</Link>
                  {attrs && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{attrs}</p>}
                  {stock === 0 && (
                    <span className="inline-block text-xs font-semibold mt-0.5 px-2 py-0.5 rounded" style={{ background: 'rgba(255,77,106,0.12)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.3)' }}>Hết hàng</span>
                  )}
                  <p className="font-bold mt-1 neon-text">{price.toLocaleString('vi-VN')}₫</p>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-0" style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={() => item.quantity > 1 ? onUpdateItem(item.id, item.quantity - 1) : null} disabled={item.quantity <= 1} style={{ background: 'var(--surface-raised)', border: 'none', color: item.quantity <= 1 ? 'var(--muted)' : 'var(--text)', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer', width: 28, height: 28, fontSize: 16 }}>−</button>
                      <span style={{ width: 32, textAlign: 'center', fontSize: 13, borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', lineHeight: '28px' }}>{item.quantity}</span>
                      <button onClick={() => item.quantity < stock ? onUpdateItem(item.id, item.quantity + 1) : null} disabled={item.quantity >= stock} style={{ background: 'var(--surface-raised)', border: 'none', color: item.quantity >= stock ? 'var(--muted)' : 'var(--text)', cursor: item.quantity >= stock ? 'not-allowed' : 'pointer', width: 28, height: 28, fontSize: 16 }}>+</button>
                    </div>
                    <button onClick={() => onRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold">{(price * item.quantity).toLocaleString('vi-VN')}₫</p>
                </div>
              </div>
            )
          })}

          <button onClick={onClearCart} className="text-sm" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>Xoá tất cả</button>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-20">
          <h2 className="font-bold text-lg mb-4">Tóm tắt đơn</h2>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
              <span>{total.toLocaleString('vi-VN')}₫</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--muted)' }}>Phí vận chuyển</span>
              <span>{shipping_fee === 0 ? <span style={{ color: 'var(--success)' }}>Miễn phí</span> : `${shipping_fee.toLocaleString('vi-VN')}₫`}</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 mb-6" style={{ borderTop: '1px solid var(--border)' }}>
            <span>Tổng cộng</span>
            <span className="neon-text">{(total + shipping_fee).toLocaleString('vi-VN')}₫</span>
          </div>
          {hasOutOfStock && (
            <p className="text-xs mb-3 text-center" style={{ color: 'var(--error)' }}>Giỏ hàng có sản phẩm hết hàng, vui lòng xoá trước khi thanh toán</p>
          )}
          <button onClick={() => navigate('/checkout')} disabled={hasOutOfStock} className="btn-primary w-full py-3" style={hasOutOfStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>Thanh toán</button>
        </div>
      </div>
    </div>
  )
}
