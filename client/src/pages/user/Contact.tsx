import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Send, Clock, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

const INFO = [
  {
    icon: MapPin,
    label: 'Địa chỉ',
    value: 'Công ty TNHH NeonGear Việt Nam',
    sub: 'Số 168 Nguyễn Văn Cừ (nối dài), P. An Bình, Q. Ninh Kiều, TP. Cần Thơ',
    color: '#00b4ff',
  },
  {
    icon: Phone,
    label: 'Hotline',
    value: '1800 6868',
    sub: 'Thứ 2 – Thứ 7: 8:00 – 21:00 (Miễn phí)',
    color: '#00ff9d',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@neongear.vn',
    sub: 'Phản hồi trong vòng 24 giờ làm việc',
    color: '#00b4ff',
  },
  {
    icon: Clock,
    label: 'Giờ làm việc',
    value: 'Thứ 2 – Thứ 7: 8:00 – 21:00',
    sub: 'Chủ nhật: 9:00 – 18:00',
    color: '#ffb800',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/contacts', form)
      setSuccess(true)
      setForm({ full_name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gửi thất bại, vui lòng thử lại')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 32 }}>
        <Link to="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Trang chủ</Link>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>Liên hệ</span>
      </div>

      {/* ── Main grid: info left + form right ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 48, marginBottom: 48, alignItems: 'start' }}>

        {/* ─ Left: Info ─ */}
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, marginBottom: 10, lineHeight: 1.2 }}>
            Liên hệ với chúng tôi
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            Chúng tôi luôn sẵn sàng hỗ trợ bạn. Hãy liên hệ qua bất kỳ kênh nào bên dưới.
          </p>

          {/* Info items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {INFO.map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{value}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social */}
          <div style={{ marginTop: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
              Kết nối với chúng tôi
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href="https://facebook.com/neongear"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  background: '#1877f2',
                  boxShadow: '0 2px 12px rgba(24,119,242,0.35)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <a
                href="https://zalo.me/neongear"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 10, textDecoration: 'none',
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  background: '#0068ff',
                  boxShadow: '0 2px 12px rgba(0,104,255,0.35)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.621 0 11.985-5.365 11.985-11.987C24.001 5.367 18.637.001 12.017.001z"/></svg>
                Zalo
              </a>
            </div>
          </div>
        </div>

        {/* ─ Right: Form ─ */}
        <div className="card" style={{ padding: '32px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,255,157,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} style={{ color: 'var(--success)' }} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Đã gửi thành công!</h3>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
              <button onClick={() => setSuccess(false)} className="btn-ghost" style={{ marginTop: 24, padding: '8px 28px', fontSize: 14 }}>
                Gửi thêm
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, fontFamily: 'Space Grotesk' }}>Gửi tin nhắn</h2>

              {error && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', color: 'var(--error)', fontSize: 13 }}>
                  {error}
                </div>
              )}

              {/* Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Họ và tên <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    required
                    className="input-inset w-full"
                    placeholder="Nguyễn Văn A"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Email <span style={{ color: 'var(--error)' }}>*</span>
                  </label>
                  <input
                    required type="email"
                    className="input-inset w-full"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Tiêu đề</label>
                <input
                  className="input-inset w-full"
                  placeholder="VD: Hỏi về chính sách đổi trả"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                  Nội dung <span style={{ color: 'var(--error)' }}>*</span>
                </label>
                <textarea
                  required rows={6}
                  className="input-inset w-full"
                  placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
                style={{ padding: '13px', fontSize: 15, fontWeight: 700, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
              >
                {loading
                  ? <><Spinner size={16} /> Đang gửi...</>
                  : <><Send size={16} /> Gửi tin nhắn</>}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Google Map ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <MapPin size={16} style={{ color: 'var(--neon-blue)' }} />
            <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Space Grotesk' }}>Vị trí showroom NeonGear</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Công ty TNHH NeonGear Việt Nam · 168 Nguyễn Văn Cừ (nối dài), P. An Bình, Q. Ninh Kiều, TP. Cần Thơ
          </p>
        </div>
        <div style={{ height: 420 }}>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.1115749624187!2d105.72033231110122!3d10.007641790056839!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a08903d92d1d0d%3A0x2c147a40ead97caa!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBOYW0gQ-G6p24gVGjGoQ!5e0!3m2!1svi!2s!4v1772965377413!5m2!1svi!2s"
            width="100%" height="100%"
            style={{ border: 0, display: 'block' }}
            allowFullScreen loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="NeonGear Store Location"
          />
        </div>
      </div>
    </div>
  )
}
