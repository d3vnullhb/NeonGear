import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import { Camera } from 'lucide-react'

const PROVINCES_API = 'https://provinces.open-api.vn/api'
const PHONE_RE = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/

interface Province { code: number; name: string }
interface District { code: number; name: string }
interface Ward     { code: number; name: string }

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    phone: user?.phone ?? '',
    date_of_birth: user?.date_of_birth?.split('T')[0] ?? '',
  })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ full_name?: string; phone?: string }>({})
  const [pwMsg, setPwMsg] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // DOB
  const [dobYear,  setDobYear]  = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobDay,   setDobDay]   = useState('')

  // Address parts
  const [addressLine, setAddressLine] = useState('')
  const [provinceCode, setProvinceCode] = useState('')
  const [provinceName, setProvinceName] = useState('')
  const [districtCode, setDistrictCode] = useState('')
  const [districtName, setDistrictName] = useState('')
  const [wardCode, setWardCode] = useState('')
  const [wardName, setWardName] = useState('')

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards,     setWards]     = useState<Ward[]>([])
  const [loadingProv, setLoadingProv] = useState(true)
  const [loadingDist, setLoadingDist] = useState(false)
  const [loadingWard, setLoadingWard] = useState(false)
  const [provApiDown, setProvApiDown] = useState(false)

  // Load provinces
  useEffect(() => {
    const CACHE_KEY = 'ng_provinces_cache'
    const CACHE_TTL = 24 * 60 * 60 * 1000
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { ts, data } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) { setProvinces(data); setLoadingProv(false); return }
      }
    } catch {}
    fetch(`${PROVINCES_API}/p`)
      .then(r => r.json())
      .then(d => {
        setProvinces(d)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: d })) } catch {}
      })
      .catch(() => setProvApiDown(true))
      .finally(() => setLoadingProv(false))
  }, [])

  // Sync user data
  useEffect(() => {
    if (!user) return
    setForm({
      full_name: user.full_name ?? '',
      phone: user.phone ?? '',
      date_of_birth: user.date_of_birth?.split('T')[0] ?? '',
    })
    if (user.date_of_birth) {
      const parts = user.date_of_birth.split('T')[0].split('-')
      setDobYear(parts[0] ?? '')
      setDobMonth(parts[1] ? String(parseInt(parts[1])) : '')
      setDobDay(parts[2]   ? String(parseInt(parts[2])) : '')
    }
    // Pre-fill address_line with existing address
    if (user.address) setAddressLine(user.address)
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
    if (y && m && d && parseInt(d) > daysInMonth(m, y)) {
      d = String(daysInMonth(m, y))
      setDobDay(d)
    }
    const dateStr = y && m && d ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
    setForm(f => ({ ...f, date_of_birth: dateStr }))
  }

  const onProvinceChange = (code: string, name: string) => {
    setProvinceCode(code); setProvinceName(name)
    setDistrictCode(''); setDistrictName(''); setWardCode(''); setWardName('')
    setDistricts([]); setWards([])
    if (!code) return
    setLoadingDist(true)
    fetch(`${PROVINCES_API}/p/${code}?depth=2`)
      .then(r => r.json())
      .then(d => setDistricts(d.districts ?? []))
      .catch(() => {})
      .finally(() => setLoadingDist(false))
  }

  const onDistrictChange = (code: string, name: string) => {
    setDistrictCode(code); setDistrictName(name)
    setWardCode(''); setWardName(''); setWards([])
    if (!code) return
    setLoadingWard(true)
    fetch(`${PROVINCES_API}/d/${code}?depth=2`)
      .then(r => r.json())
      .then(d => setWards(d.wards ?? []))
      .catch(() => {})
      .finally(() => setLoadingWard(false))
  }

  const buildAddress = () => {
    const parts = [addressLine.trim(), wardName, districtName, provinceName].filter(Boolean)
    return parts.join(', ')
  }

  const currentYear = new Date().getFullYear()
  const maxBirthYear = currentYear - 10
  const years  = Array.from({ length: maxBirthYear - 1923 }, (_, i) => maxBirthYear - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days   = Array.from({ length: daysInMonth(dobMonth, dobYear) }, (_, i) => i + 1)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { full_name?: string; phone?: string } = {}
    if (!form.full_name.trim()) errors.full_name = 'Vui lòng nhập họ tên'
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ'
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setLoading(true)
    setMsg('')
    try {
      const address = buildAddress() || addressLine
      const { data } = await api.put('/users/me', { ...form, address, date_of_birth: form.date_of_birth || undefined })
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
    if (file.size > 5 * 1024 * 1024) { setMsg('Ảnh không được vượt quá 5MB'); return }
    if (!file.type.startsWith('image/')) { setMsg('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP...)'); return }
    const fd = new FormData()
    fd.append('avatar', file)
    setAvatarLoading(true)
    try {
      const { data } = await api.post('/users/me/avatar', fd)
      updateUser(data.data)
      setMsg('Cập nhật ảnh đại diện thành công!')
    } finally {
      setAvatarLoading(false)
      // Reset input so selecting the same file again triggers onChange
      if (avatarInputRef.current) avatarInputRef.current.value = ''
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
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
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
            <input type="text" value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); setFieldErrors(f => ({ ...f, full_name: undefined })) }} className="input-inset w-full" />
            {fieldErrors.full_name && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{fieldErrors.full_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setFieldErrors(f => ({ ...f, phone: undefined })) }} className="input-inset w-full" />
            {fieldErrors.phone && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{fieldErrors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ngày sinh</label>
            <div className="flex gap-2">
              <select value={dobDay} onChange={e => handleDobChange('day', e.target.value)} className="input-inset flex-1">
                <option value="">Ngày</option>
                {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
              </select>
              <select value={dobMonth} onChange={e => handleDobChange('month', e.target.value)} className="input-inset flex-1">
                <option value="">Tháng</option>
                {months.map(m => <option key={m} value={String(m)}>Tháng {m}</option>)}
              </select>
              <select value={dobYear} onChange={e => handleDobChange('year', e.target.value)} className="input-inset flex-[1.4]">
                <option value="">Năm</option>
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Địa chỉ chi tiết</label>
            <input type="text" placeholder="Số nhà, tên đường..." value={addressLine}
              onChange={e => setAddressLine(e.target.value)} className="input-inset w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
            {provApiDown
              ? <input className="input-inset w-full" placeholder="Nhập tỉnh/thành phố" value={provinceName}
                  onChange={e => { setProvinceName(e.target.value); setProvinceCode('manual') }} />
              : <select className="input-inset w-full" value={provinceCode} disabled={loadingProv}
                  onChange={e => { const opt = provinces.find(p => String(p.code) === e.target.value); onProvinceChange(e.target.value, opt?.name ?? '') }}>
                  <option value="">{loadingProv ? 'Đang tải...' : '-- Chọn tỉnh/thành phố --'}</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
            {provApiDown
              ? <input className="input-inset w-full" placeholder="Nhập quận/huyện" value={districtName}
                  onChange={e => { setDistrictName(e.target.value); setDistrictCode('manual') }} />
              : <select className="input-inset w-full" value={districtCode} disabled={!provinceCode || loadingDist}
                  onChange={e => { const opt = districts.find(d => String(d.code) === e.target.value); onDistrictChange(e.target.value, opt?.name ?? '') }}>
                  <option value="">{!provinceCode ? 'Chọn tỉnh trước' : loadingDist ? 'Đang tải...' : '-- Chọn quận/huyện --'}</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phường/Xã</label>
            {provApiDown
              ? <input className="input-inset w-full" placeholder="Nhập phường/xã" value={wardName}
                  onChange={e => { setWardName(e.target.value); setWardCode('manual') }} />
              : <select className="input-inset w-full" value={wardCode} disabled={!districtCode || loadingWard}
                  onChange={e => { const opt = wards.find(w => String(w.code) === e.target.value); setWardCode(e.target.value); setWardName(opt?.name ?? '') }}>
                  <option value="">{!districtCode ? 'Chọn quận/huyện trước' : loadingWard ? 'Đang tải...' : '-- Chọn phường/xã --'}</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>}
          </div>

          {/* Address preview */}
          {buildAddress() && (
            <div className="col-span-2" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,180,255,0.07)', border: '1px solid rgba(0,180,255,0.18)', fontSize: 13 }}>
              <span style={{ color: 'var(--neon-blue)', fontWeight: 600 }}>Địa chỉ: </span>
              <span style={{ color: 'var(--muted)' }}>{buildAddress()}</span>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
        <h2 className="font-bold">Đổi mật khẩu</h2>
        {pwMsg && <p className="text-sm" style={{ color: pwMsg.includes('thành') ? 'var(--success)' : 'var(--error)' }}>{pwMsg}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
          <input type="password" required value={pwForm.old_password} onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })} className="input-inset w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
          <input type="password" required value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} className="input-inset w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
          <input type="password" required value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} className="input-inset w-full" />
        </div>
        <button type="submit" disabled={pwLoading} className="btn-primary">{pwLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}</button>
      </form>
    </div>
  )
}
