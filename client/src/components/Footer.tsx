import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, MapPin, Phone, Mail } from 'lucide-react'
import api from '../lib/api'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [subError, setSubError] = useState('')

  async function handleSubscribe(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!email.trim()) return
    setSubLoading(true)
    setSubError('')
    try {
      await api.post('/subscribers', { email: email.trim().toLowerCase() })
      setSubscribed(true)
      setEmail('')
    } catch (err: any) {
      setSubError(err?.response?.data?.message ?? 'Đăng ký thất bại, vui lòng thử lại')
    } finally {
      setSubLoading(false)
    }
  }

  const wrap: React.CSSProperties = { maxWidth: '80rem', margin: '0 auto', paddingLeft: '2rem', paddingRight: '2rem' }

  const socialLinks = [
    {
      label: 'Facebook',
      href: 'https://facebook.com',
      color: '#1877f2',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
    },
    {
      label: 'Instagram',
      href: 'https://instagram.com',
      color: '#e1306c',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
    },
    {
      label: 'TikTok',
      href: 'https://tiktok.com',
      color: '#ffffff',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.35 6.35 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>,
    },
    {
      label: 'YouTube',
      href: 'https://youtube.com',
      color: '#ff0000',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>,
    },
  ]

  return (
    <footer className="mt-auto w-full" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>

      {/* ── Newsletter Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #071624 0%, #091c30 50%, #071624 100%)',
        borderBottom: '1px solid rgba(0,180,255,0.2)',
      }}>
        <div style={{ ...wrap, paddingTop: '1.5rem', paddingBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem' }}>
          <p className="font-bold text-sm uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
            Nhận thông tin khuyến mãi từ NeonGear
          </p>
          {subscribed ? (
            <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>✓ Đăng ký thành công! Cảm ơn bạn.</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-1">
              {subError && <p className="text-xs" style={{ color: 'var(--error)' }}>{subError}</p>}
              <div className="flex gap-0" style={{ width: '600px', maxWidth: '100%' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Nhập email ưu đãi"
                  required
                  className="flex-1 px-5 text-sm outline-none transition-all"
                  style={{
                    height: '3rem',
                    background: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    color: 'var(--text)',
                    boxShadow: 'inset 3px 3px 6px #06060c, inset -3px -3px 6px #1e1e2e',
                  }}
                  onInvalid={e => e.currentTarget.setCustomValidity('Vui lòng nhập email của bạn')}
                  onInput={e => e.currentTarget.setCustomValidity('')}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--neon-blue)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="text-sm font-bold uppercase tracking-wider transition-all shrink-0"
                  style={{
                    minWidth: '130px',
                    height: '3rem',
                    background: 'var(--neon-blue)',
                    color: '#000',
                    borderRadius: '0 8px 8px 0',
                    boxShadow: '0 0 12px rgba(0,180,255,0.4)',
                    fontFamily: 'Space Grotesk',
                    opacity: subLoading ? 0.7 : 1,
                    cursor: subLoading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !subLoading && (e.currentTarget.style.boxShadow = '0 0 20px rgba(0,180,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 12px rgba(0,180,255,0.4)')}
                >
                  {subLoading ? '...' : 'Đăng ký'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Main Footer Body ── */}
      <div style={{ ...wrap, paddingTop: '2.5rem', paddingBottom: '0.5rem' }}>

        {/* Logo + tagline row */}
        <div className="flex items-center gap-3 mb-8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1.75rem' }}>
          <Link to="/" className="flex items-center gap-2.5">
            <Zap size={28} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
            <span className="text-2xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</span>
          </Link>
          <span className="text-base" style={{ color: 'var(--muted)', fontStyle: 'italic', marginLeft: '0.5rem' }}>
            Vì gaming là đam mê
          </span>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10">

          {/* Col 1 — Liên hệ */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>Liên hệ</h4>
            <div className="flex flex-col gap-3.5">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--neon-blue)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0" style={{ color: 'var(--neon-blue)' }} />
                <a href="tel:1800neongear" className="text-sm font-semibold transition-colors" style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                  1800 NEONGEAR
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0" style={{ color: 'var(--neon-blue)' }} />
                <a href="mailto:support@neongear.vn" className="text-sm transition-colors" style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                  support@neongear.vn
                </a>
              </div>
            </div>
          </div>

          {/* Col 2 — Giới thiệu */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>Giới thiệu</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Về NeonGear', to: '/contact' },
                { label: 'Blog & Tin tức', to: '/posts' },
                { label: 'Liên hệ với chúng tôi', to: '/contact' },
                { label: 'Sản phẩm', to: '/products' },
              ].map(item => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-sm transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3 — Chính sách */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>Chính sách</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Chính sách bảo mật', to: '/chinh-sach/bao-mat' },
                { label: 'Chính sách đổi trả / hoàn tiền', to: '/chinh-sach/doi-tra-hoan-tien' },
                { label: 'Chính sách thanh toán & vận chuyển', to: '/chinh-sach/thanh-toan-van-chuyen' },
              ].map(item => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-sm transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--neon-blue)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 4 — Phương thức thanh toán */}
          <div>
            <h4 className="font-bold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>Phương thức thanh toán</h4>
            <img src="/images/payment-methods.png" alt="Phương thức thanh toán" style={{ height: '90px', width: 'auto', marginBottom: '1.5rem' }} />
            <a href="http://online.gov.vn" target="_blank" rel="noopener noreferrer">
              <img src="/images/bct-badge.png" alt="Đã thông báo Bộ Công Thương" style={{ height: '52px', width: 'auto' }} />
            </a>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div style={{ ...wrap, paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            NEONGEAR — © 2026 All Rights Reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs mr-1" style={{ color: 'var(--muted)' }}>Follow us</span>
            {socialLinks.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                style={{ background: 'var(--surface-raised)', border: `1px solid ${s.color}40`, color: s.color }}
                onMouseEnter={e => { e.currentTarget.style.background = s.color; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-raised)'; e.currentTarget.style.color = s.color }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
