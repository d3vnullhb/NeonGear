import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, ArrowLeft, Mail } from 'lucide-react'
import api from '../../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Vui lòng nhập email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email không hợp lệ'); return }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gửi email thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)', minHeight: 'calc(100dvh - 4rem)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={28} style={{ color: 'var(--neon-blue)' }} />
            <span className="text-2xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</span>
          </div>
          <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Nhập email để nhận link đặt lại mật khẩu
          </p>
        </div>

        <div className="card p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.3)' }}>
                  <Mail size={32} style={{ color: 'var(--neon-blue)' }} />
                </div>
              </div>
              <div>
                <p className="font-medium">Email đã được gửi!</p>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Kiểm tra hộp thư <strong style={{ color: 'var(--text)' }}>{email}</strong> và làm theo hướng dẫn để đặt lại mật khẩu.
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Không thấy email? Kiểm tra thư mục spam hoặc{' '}
                <button
                  onClick={() => setSent(false)}
                  style={{ color: 'var(--neon-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  thử lại
                </button>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.2)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-inset"
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}

          <div className="pt-2">
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              <ArrowLeft size={14} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
