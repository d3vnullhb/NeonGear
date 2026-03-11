import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, CheckCircle } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function CartNotification() {
  const { justAdded, dismissCart } = useCart()
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (!justAdded) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(dismissCart, 5000)
    return () => clearTimeout(timerRef.current)
  }, [justAdded])

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        pointerEvents: justAdded ? 'auto' : 'none',
        opacity: justAdded ? 1 : 0,
        transform: justAdded ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
        transition: justAdded
          ? 'opacity 280ms ease, transform 320ms cubic-bezier(0.34, 1.2, 0.64, 1)'
          : 'opacity 200ms ease, transform 200ms ease',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,255,157,0.1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(0,255,157,0.08)',
          borderBottom: '1px solid rgba(0,255,157,0.15)',
          padding: '11px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CheckCircle size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600, flex: 1 }}>
            Đã thêm vào giỏ hàng!
          </span>
          <button
            onClick={dismissCart}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex', lineHeight: 1 }}
            aria-label="Đóng"
          >
            <X size={15} />
          </button>
        </div>

        {/* Product info */}
        {justAdded && (
          <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {justAdded.image_url
              ? <img
                  src={justAdded.image_url}
                  alt={justAdded.name}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}
                />
              : <div style={{ width: 60, height: 60, borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  🖱️
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link
                to={`/products/${justAdded.slug}`}
                onClick={dismissCart}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  textDecoration: 'none',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                  lineHeight: 1.4,
                }}
              >
                {justAdded.name}
              </Link>
              {justAdded.variant_name && (
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{justAdded.variant_name}</p>
              )}
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--neon-blue)', marginTop: 4, textShadow: '0 0 10px rgba(0,180,255,0.35)' }}>
                {Number(justAdded.price).toLocaleString('vi-VN')}₫
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 14px 14px' }}>
          <Link
            to="/cart"
            onClick={dismissCart}
            className="btn-ghost"
            style={{ textAlign: 'center', padding: '8px 10px', fontSize: 12.5, justifyContent: 'center' }}
          >
            Xem giỏ hàng
          </Link>
          <Link
            to="/checkout"
            onClick={dismissCart}
            className="btn-primary"
            style={{ textAlign: 'center', padding: '8px 10px', fontSize: 12.5, justifyContent: 'center' }}
          >
            Thanh toán ngay
          </Link>
        </div>
      </div>
    </div>
  )
}
