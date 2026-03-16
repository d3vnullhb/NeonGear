import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Camera } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
    date_of_birth: user?.date_of_birth?.split('T')[0] ?? '',
  })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)

  // DOB parts stored as plain number strings ("1"–"12", "1"–"31", "2000")
  const [dobYear,  setDobYear]  = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobDay,   setDobDay]   = useState('')

  // Sync form and DOB state when user data loads (auth context may be async)
  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
      date_of_birth: user.date_of_birth?.split('T')[0] ?? '',
    })
    if (user.date_of_birth) {
      const parts = user.date_of_birth.split('T')[0].split('-')
      setDobYear(parts[0] ?? '')
      // Remove leading zeros so they match plain-number option values
      setDobMonth(parts[1] ? String(parseInt(parts[1])) : '')
      setDobDay(parts[2]   ? String(parseInt(parts[2])) : '')
    }
  }, [user?.user_id])

  function daysInMonth(month: string, year: string) {
    if (!month) return 31
    return new Date(parseInt(year) || 2000, parseInt(month), 0).getDate()
  }

  function handleDobChange(part: 'year' | 'month' | 'day', value: string) {
    let y = part === 'year'  ? value : dobYear
    let m = part === 'month' ? value : dobMonth
    let d = part === 'day'   ? value : dobDay
    if (part === 'year')  setDobYear(value)
    if (part === 'month') setDobMonth(value)
    if (part === 'day')   setDobDay(value)
    // Clamp day when month/year reduces available days
    if (y && m && d && parseInt(d) > daysInMonth(m, y)) {
      d = String(daysInMonth(m, y))
      setDobDay(d)
    }
    // Build ISO date string with zero-padded month/day for backend
    const dateStr = y && m && d
      ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      : ''
    setForm(f => ({ ...f, date_of_birth: dateStr }))
  }

  const currentYear = new Date().getFullYear()
  const maxBirthYear = currentYear - 10
  const years = Array.from({ length: maxBirthYear - 1923 }, (_, i) => maxBirthYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: daysInMonth(dobMonth, dobYear) }, (_, i) => i + 1)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const { data } = await api.put('/users/me', { ...form, date_of_birth: form.date_of_birth || undefined })
      updateUser(data.data)
      setMsg('Cập nhật thành công!')
    } catch (err: any) {
      setMsg(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwForm.new_password || pwForm.new_password.length < 8) { setPwMsg('Mật khẩu mới phải có ít nhất 8 ký tự'); return }
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg('Mật khẩu xác nhận không khớp'); return }
    setPwLoading(true)
    setPwMsg('')
    try {
      await api.put('/auth/change-password', { old_password: pwForm.old_password, new_password: pwForm.new_password })
      setPwMsg('Đổi mật khẩu thành công!')
      setPwForm({ old_password: '', new_password: '', confirm: '' })
    } catch (err: any) {
      setPwMsg(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setPwLoading(false)
    }
  }

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setMsg('Ảnh không được vượt quá 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setMsg('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP...)')
      return
    }
    const fd = new FormData()
    fd.append('avatar', file)
    setAvatarLoading(true)
    try {
      const { data } = await api.post('/users/me/avatar', fd)
      updateUser(data.data)
      setMsg('')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Hồ sơ cá nhân</h1>

      {/* Avatar */}
      <div className="card p-6 mb-4 flex items-center gap-4">
        <div className="relative">
          {user?.avatar_url
            ? <img src={user.avatar_url} className="w-20 h-20 rounded-full object-cover" />
            : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--surface-raised)' }}>{user?.full_name[0]}</div>}
          <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer" style={{ background: 'var(--neon-blue)', color: '#000' }}>
            <Camera size={14} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
          </label>
        </div>
        <div>
          <p className="font-semibold">{user?.full_name}</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--neon-blue)' }}>{user?.role}</p>
          {avatarLoading && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Đang upload...</p>}
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleUpdateProfile} className="card p-6 space-y-4 mb-4">
        <h2 className="font-bold">Thông tin cá nhân</h2>
        {msg && <p className="text-sm" style={{ color: msg.includes('thành') ? 'var(--success)' : 'var(--error)' }}>{msg}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Họ tên</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-inset" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-inset" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ngày sinh</label>
            <div className="flex gap-2">
              <select
                value={dobDay}
                onChange={e => handleDobChange('day', e.target.value)}
                className="input-inset flex-1"
              >
                <option value="">Ngày</option>
                {days.map(d => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>
              <select
                value={dobMonth}
                onChange={e => handleDobChange('month', e.target.value)}
                className="input-inset flex-1"
              >
                <option value="">Tháng</option>
                {months.map(m => (
                  <option key={m} value={String(m)}>Tháng {m}</option>
                ))}
              </select>
              <select
                value={dobYear}
                onChange={e => handleDobChange('year', e.target.value)}
                className="input-inset flex-[1.4]"
              >
                <option value="">Năm</option>
                {years.map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-inset" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
        <h2 className="font-bold">Đổi mật khẩu</h2>
        {pwMsg && <p className="text-sm" style={{ color: pwMsg.includes('thành') ? 'var(--success)' : 'var(--error)' }}>{pwMsg}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
          <input type="password" required value={pwForm.old_password} onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} className="input-inset" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
          <input type="password" required value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} className="input-inset" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
          <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-inset" />
        </div>
        <button type="submit" disabled={pwLoading} className="btn-primary">{pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
      </form>
    </div>
  )
}
