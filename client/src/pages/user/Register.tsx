import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { facebookLogin, FB_ENABLED } from '../../lib/facebook'

export default function Register() {
  const { register, loginWithGoogle, loginWithFacebook } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim()) { setError('Vui lòng nhập họ tên'); return }
    if (!form.email.trim()) { setError('Vui lòng nhập email'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Email không hợp lệ'); return }
    if (!form.password) { setError('Vui lòng nhập mật khẩu'); return }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    setLoading(true)
    try {
      await register(form.full_name, form.email, form.password, form.phone || undefined)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      setSocialLoading('google')
      try {
        await loginWithGoogle(access_token)
        navigate('/')
      } catch (err: any) {
        setError(err.response?.data?.message ?? 'Đăng nhập Google thất bại')
      } finally {
        setSocialLoading(null)
      }
    },
    onError: () => setError('Đăng nhập Google bị huỷ'),
  })

  const handleFacebook = async () => {
    setSocialLoading('facebook')
    try {
      const access_token = await facebookLogin()
      await loginWithFacebook(access_token)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Đăng nhập Facebook thất bại')
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)', minHeight: 'calc(100dvh - 4rem)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={28} style={{ color: 'var(--neon-blue)' }} />
            <span className="text-2xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</span>
          </div>
          <h1 className="text-2xl font-bold">Đăng ký</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Tạo tài khoản mới</p>
        </div>

        <div className="card p-6 space-y-4">
          {error && (
            <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.2)' }}>
              {error}
            </div>
          )}

          {/* Social buttons — chỉ hiện khi có env key */}
          {(import.meta.env.VITE_GOOGLE_CLIENT_ID || FB_ENABLED) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                  <button
                    type="button"
                    onClick={() => handleGoogle()}
                    disabled={!!socialLoading}
                    className="btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    {socialLoading === 'google' ? '...' : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                        Google
                      </>
                    )}
                  </button>
                )}
                {FB_ENABLED && (
                  <button
                    type="button"
                    onClick={handleFacebook}
                    disabled={!!socialLoading}
                    className="btn-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
                  >
                    {socialLoading === 'facebook' ? '...' : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                        Facebook
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>hoặc</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Họ tên</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-inset" placeholder="Nguyễn Văn A" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-inset" placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Số điện thoại (tuỳ chọn)</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-inset" placeholder="0912345678" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mật khẩu</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-inset pr-10" placeholder="Ít nhất 6 ký tự" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

          <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--neon-blue)' }}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
