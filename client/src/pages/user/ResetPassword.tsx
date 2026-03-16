import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import api from '../../lib/api'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [form, setForm] = useState({ new_password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)', minHeight: 'calc(100dvh - 4rem)' }}>
        <div className="text-center space-y-4">
          <p style={{ color: 'var(--error)' }}>Link không hợp lệ hoặc đã hết hạn.</p>
          <Link to="/forgot-password" style={{ color: 'var(--neon-blue)' }}>Yêu cầu link mới</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.new_password) { setError('Vui lòng nhập mật khẩu mới'); return }
    if (form.new_password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return }
    if (form.new_password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: form.new_password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Đặt lại mật khẩu thất bại')
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
          <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Tạo mật khẩu mới cho tài khoản</p>
        </div>

        <div className="card p-6 space-y-4">
          {success ? (
            <div className="text-center py-4 space-y-2">
              <p className="font-medium" style={{ color: 'var(--success)' }}>Đặt lại mật khẩu thành công!</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Đang chuyển về trang đăng nhập...</p>
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
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                      className="input-inset pr-10"
                      placeholder="Ít nhất 8 ký tự"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="input-inset"
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}

          <div className="pt-2">
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
              <ArrowLeft size={14} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
