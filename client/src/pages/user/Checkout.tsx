import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Lock, Truck, Zap, CreditCard, Wallet, Package, Banknote, ShieldCheck, RefreshCw, Tag } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

function paymentAxios() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  return axios.create({
    baseURL: '/api/payment',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

interface Province { code: number; name: string }
interface District { code: number; name: string }
interface Ward    { code: number; name: string }

interface AddressForm {
  recipient_name: string
  recipient_phone: string
  address_line: string
  ward_name: string; ward_code: string
  district_name: string; district_code: string
  province_name: string; province_code: string
}

interface FieldErrors {
  recipient_name?: string
  recipient_phone?: string
  address_line?: string
  ward?: string; district?: string; province?: string
}

const PHONE_RE = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/
const PROVINCES_API = 'https://provinces.open-api.vn/api'

function validate(addr: AddressForm): FieldErrors {
  const err: FieldErrors = {}
  if (!addr.recipient_name.trim()) err.recipient_name = 'Vui lòng nhập tên người nhận'
  else if (addr.recipient_name.trim().length < 2) err.recipient_name = 'Tên ít nhất 2 ký tự'
  if (!addr.recipient_phone.trim()) err.recipient_phone = 'Vui lòng nhập số điện thoại'
  else if (!PHONE_RE.test(addr.recipient_phone.trim())) err.recipient_phone = 'Số điện thoại không hợp lệ'
  if (!addr.address_line.trim()) err.address_line = 'Vui lòng nhập địa chỉ chi tiết'
  if (!addr.province_code) err.province = 'Vui lòng chọn tỉnh/thành phố'
  if (!addr.district_code) err.district = 'Vui lòng chọn quận/huyện'
  if (!addr.ward_code) err.ward = 'Vui lòng chọn phường/xã'
  return err
}

function buildShippingAddress(addr: AddressForm) {
  return `${addr.recipient_name.trim()} - ${addr.recipient_phone.trim()}\n${addr.address_line.trim()}, ${addr.ward_name}, ${addr.district_name}, ${addr.province_name}`
}

// ── Section header ───────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      <Icon size={15} style={{ color: 'var(--neon-blue)' }} />
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--neon-blue)' }}>
        {children}
      </h2>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

export default function Checkout() {
  const { cart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [addr, setAddr] = useState<AddressForm>({
    recipient_name: user?.full_name ?? '',
    recipient_phone: user?.phone ?? '',
    address_line: '',
    ward_name: '', ward_code: '',
    district_name: '', district_code: '',
    province_name: '', province_code: '',
  })
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [note, setNote] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponInfo, setCouponInfo] = useState<{ discount_amount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loadingProv, setLoadingProv] = useState(true)
  const [loadingDist, setLoadingDist] = useState(false)
  const [loadingWard, setLoadingWard] = useState(false)

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const subtotal  = cart?.cart_items.reduce((s, i) => s + Number(i.product_variants?.price ?? 0) * i.quantity, 0) ?? 0
  const discount  = couponInfo?.discount_amount ?? 0
  const shippingFee = shippingMethod === 'express' ? 50000 : (subtotal >= 500000 ? 0 : 30000)
  const finalTotal = Math.max(0, subtotal - discount + shippingFee)

  useEffect(() => {
    fetch(`${PROVINCES_API}/p/`).then(r => r.json()).then(setProvinces).catch(() => {}).finally(() => setLoadingProv(false))
  }, [])

  const onProvinceChange = (code: string, name: string) => {
    setAddr(a => ({ ...a, province_code: code, province_name: name, district_code: '', district_name: '', ward_code: '', ward_name: '' }))
    setDistricts([]); setWards([])
    setFieldErrors(e => ({ ...e, province: undefined }))
    if (!code) return
    setLoadingDist(true)
    fetch(`${PROVINCES_API}/p/${code}?depth=2`).then(r => r.json()).then(d => setDistricts(d.districts ?? [])).catch(() => {}).finally(() => setLoadingDist(false))
  }

  const onDistrictChange = (code: string, name: string) => {
    setAddr(a => ({ ...a, district_code: code, district_name: name, ward_code: '', ward_name: '' }))
    setWards([])
    setFieldErrors(e => ({ ...e, district: undefined }))
    if (!code) return
    setLoadingWard(true)
    fetch(`${PROVINCES_API}/d/${code}?depth=2`).then(r => r.json()).then(d => setWards(d.wards ?? [])).catch(() => {}).finally(() => setLoadingWard(false))
  }

  const onWardChange = (code: string, name: string) => {
    setAddr(a => ({ ...a, ward_code: code, ward_name: name }))
    setFieldErrors(e => ({ ...e, ward: undefined }))
  }

  const setAddrField = (field: keyof AddressForm, value: string) => {
    setAddr(a => ({ ...a, [field]: value }))
    const key = field as keyof FieldErrors
    if (key in ({} as FieldErrors)) setFieldErrors(e => ({ ...e, [key]: undefined }))
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) { setCouponError('Vui lòng nhập mã giảm giá'); return }
    setCouponError(''); setApplyingCoupon(true)
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, order_amount: subtotal })
      setCouponInfo(data.data)
    } catch (err: any) {
      setCouponError(err.response?.data?.message ?? 'Mã không hợp lệ hoặc đã hết hạn')
      setCouponInfo(null)
    } finally { setApplyingCoupon(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validate(addr)
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }
    setSubmitting(true); setSubmitError('')
    try {
      const { data: orderData } = await api.post('/orders', {
        shipping_address: buildShippingAddress(addr),
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        note: note || undefined,
        coupon_code: couponInfo ? couponCode : undefined,
      })
      const orderId: number = orderData.data.order_id

      if (paymentMethod === 'vnpay') {
        const { data: payData } = await paymentAxios().post('/vnpay/create', { orderId, amount: finalTotal, orderInfo: `Thanh toán đơn hàng #${orderData.data.order_code ?? orderId}` })
        if (payData.data?.redirectUrl) { window.location.href = payData.data.redirectUrl; return }
        throw new Error(payData.message ?? 'Không tạo được link VNPay')
      }
      if (paymentMethod === 'momo') {
        const { data: payData } = await paymentAxios().post('/momo/create', { orderId, amount: finalTotal, orderInfo: `Thanh toán đơn hàng #${orderData.data.order_code ?? orderId}` })
        if (payData.data?.redirectUrl) { window.location.href = payData.data.redirectUrl; return }
        throw new Error(payData.message ?? 'Không tạo được link MoMo')
      }

      await fetchCart()
      navigate(`/orders/${orderId}`)
    } catch (err: any) {
      setSubmitError(err.response?.data?.message ?? err.message ?? 'Đặt hàng thất bại, vui lòng thử lại')
    } finally { setSubmitting(false) }
  }

  if (!cart || !cart.cart_items.length) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <Package size={48} style={{ color: 'var(--muted)' }} />
      <p style={{ color: 'var(--muted)' }}>Giỏ hàng trống</p>
      <Link to="/products" className="btn-primary">Mua sắm ngay</Link>
    </div>
  )

  // ── Shared radio option style ────────────────────────────────────────────
  const radioOption = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
    border: active ? '1.5px solid var(--neon-blue)' : '1px solid var(--border)',
    background: active ? 'rgba(0,180,255,0.06)' : 'transparent',
    transition: 'all 150ms',
  } as React.CSSProperties)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Checkout header ── */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--neon-blue)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            <ArrowLeft size={15} /> Quay lại giỏ hàng
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="neon-text" style={{ fontFamily: 'Space Grotesk', fontSize: 20, fontWeight: 700 }}>NeonGear</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted)' }}>
            <Lock size={14} /> Thanh toán an toàn
          </div>
        </div>
      </header>

      {/* ── Breadcrumb ── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Link to="/cart" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>Giỏ hàng</Link>
          <span style={{ color: 'var(--muted)' }}>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Thanh toán</span>
          <span style={{ color: 'var(--muted)' }}>›</span>
          <span style={{ color: 'var(--muted)' }}>Hoàn tất</span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px 60px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* ════════════ LEFT FORM ════════════ */}
        <form onSubmit={handleSubmit} style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ─ Shipping address ─ */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <SectionTitle icon={Truck}>Địa chỉ giao hàng</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Họ và tên *" error={fieldErrors.recipient_name}>
                <input className="input-inset w-full" placeholder="Nguyễn Văn A"
                  value={addr.recipient_name}
                  onChange={e => { setAddr(a => ({ ...a, recipient_name: e.target.value })); setFieldErrors(f => ({ ...f, recipient_name: undefined })) }} />
              </Field>
              <Field label="Số điện thoại *" error={fieldErrors.recipient_phone}>
                <input className="input-inset w-full" type="tel" placeholder="0912 345 678" maxLength={12}
                  value={addr.recipient_phone}
                  onChange={e => { setAddr(a => ({ ...a, recipient_phone: e.target.value })); setFieldErrors(f => ({ ...f, recipient_phone: undefined })) }} />
              </Field>
              <Field label="Email">
                <input className="input-inset w-full" type="email" placeholder="email@example.com"
                  defaultValue={user?.email ?? ''} readOnly
                  style={{ opacity: 0.55, cursor: 'default' }} />
              </Field>
              <Field label="Tỉnh/Thành phố *" error={fieldErrors.province}>
                <select className="input-inset w-full" value={addr.province_code}
                  disabled={loadingProv}
                  onChange={e => { const opt = provinces.find(p => String(p.code) === e.target.value); onProvinceChange(e.target.value, opt?.name ?? '') }}>
                  <option value="">{loadingProv ? 'Đang tải...' : '-- Chọn tỉnh/thành phố --'}</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Quận/Huyện *" error={fieldErrors.district}>
                <select className="input-inset w-full" value={addr.district_code}
                  disabled={!addr.province_code || loadingDist}
                  onChange={e => { const opt = districts.find(d => String(d.code) === e.target.value); onDistrictChange(e.target.value, opt?.name ?? '') }}>
                  <option value="">{!addr.province_code ? 'Chọn tỉnh trước' : loadingDist ? 'Đang tải...' : '-- Chọn quận/huyện --'}</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Phường/Xã *" error={fieldErrors.ward}>
                <select className="input-inset w-full" value={addr.ward_code}
                  disabled={!addr.district_code || loadingWard}
                  onChange={e => { const opt = wards.find(w => String(w.code) === e.target.value); onWardChange(e.target.value, opt?.name ?? '') }}>
                  <option value="">{!addr.district_code ? 'Chọn quận/huyện trước' : loadingWard ? 'Đang tải...' : '-- Chọn phường/xã --'}</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </select>
              </Field>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Địa chỉ chi tiết *" error={fieldErrors.address_line}>
                  <input className="input-inset w-full" placeholder="Số nhà, tên đường..."
                    value={addr.address_line}
                    onChange={e => { setAddr(a => ({ ...a, address_line: e.target.value })); setFieldErrors(f => ({ ...f, address_line: undefined })) }} />
                </Field>
              </div>
            </div>

            {/* Address preview */}
            {addr.province_code && addr.district_code && addr.ward_code && addr.address_line && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(0,180,255,0.07)', border: '1px solid rgba(0,180,255,0.18)', fontSize: 13 }}>
                <span style={{ color: 'var(--neon-blue)', fontWeight: 600 }}>Địa chỉ: </span>
                <span style={{ color: 'var(--muted)' }}>{addr.address_line}, {addr.ward_name}, {addr.district_name}, {addr.province_name}</span>
              </div>
            )}
          </div>

          {/* ─ Shipping method ─ */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <SectionTitle icon={Package}>Phương thức giao hàng</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { value: 'standard', label: 'Giao hàng tiêu chuẩn', sub: '3-5 ngày làm việc • Miễn phí trên 500k', price: shippingFee === 0 && shippingMethod === 'standard' ? 'Miễn phí' : '30.000₫', Icon: Truck },
                { value: 'express',  label: 'Giao hàng nhanh',      sub: '1-2 ngày làm việc',                       price: '50.000₫',                                                                    Icon: Zap  },
              ] as const).map(m => {
                const active = shippingMethod === m.value
                return (
                  <label key={m.value} style={radioOption(active)}>
                    <input type="radio" value={m.value} checked={active} onChange={() => setShippingMethod(m.value)}
                      style={{ accentColor: 'var(--neon-blue)', width: 16, height: 16, flexShrink: 0 }} />
                    <m.Icon size={15} style={{ color: active ? 'var(--neon-blue)' : 'var(--muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.sub}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: m.price === 'Miễn phí' ? 'var(--success)' : 'var(--text)', flexShrink: 0 }}>{m.price}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* ─ Payment method ─ */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <SectionTitle icon={CreditCard}>Phương thức thanh toán</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { value: 'cod',           label: 'Thanh toán khi nhận hàng (COD)', sub: 'Thanh toán tiền mặt khi nhận hàng',                    Icon: Banknote, badge: null },
                { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng',          sub: 'Thông tin tài khoản gửi qua email sau khi đặt hàng', Icon: CreditCard, badge: null },
                { value: 'vnpay',         label: 'Thanh toán VNPay',                sub: 'ATM, thẻ tín dụng, QR Code qua cổng VNPay',          Icon: CreditCard, badge: 'vnpay' as const },
                { value: 'momo',          label: 'Ví điện tử MoMo',                 sub: 'Quét mã QR hoặc thanh toán qua ứng dụng MoMo',       Icon: Wallet,     badge: 'momo' as const },
              ]).map(m => {
                const active = paymentMethod === m.value
                return (
                  <label key={m.value} style={radioOption(active)}>
                    <input type="radio" value={m.value} checked={active} onChange={() => setPaymentMethod(m.value)}
                      style={{ accentColor: 'var(--neon-blue)', width: 16, height: 16, flexShrink: 0 }} />
                    <m.Icon size={15} style={{ color: active ? 'var(--neon-blue)' : 'var(--muted)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{m.sub}</p>
                    </div>
                    {m.badge === 'vnpay' && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#0057A0', color: '#fff', flexShrink: 0 }}>VNPay</span>}
                    {m.badge === 'momo'  && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#A50064', color: '#fff', flexShrink: 0 }}>MoMo</span>}
                  </label>
                )
              })}
            </div>
          </div>

          {/* ─ Note ─ */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <SectionTitle icon={Package}>Ghi chú đơn hàng</SectionTitle>
            <textarea
              className="input-inset w-full"
              rows={3}
              placeholder="Ghi chú cho người giao hàng..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </form>

        {/* ════════════ RIGHT SIDEBAR ════════════ */}
        <aside style={{ width: 380, flexShrink: 0, position: 'sticky', top: 70 }}>
          <div className="card" style={{ padding: '24px' }}>

            {/* Order header */}
            <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
              Đơn hàng ({cart.cart_items.length} sản phẩm)
            </h3>

            {/* Product list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {cart.cart_items.map(item => {
                const product = item.product_variants?.products
                const variant = item.product_variants
                const img = variant?.image_url ?? product?.product_images?.find(i => i.is_main)?.image_url
                const attrs = variant?.product_attribute_values?.map(a => a.value).join(' / ')
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                        {img
                          ? <img src={img} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>}
                      </div>
                      <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--muted)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.quantity}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }} className="truncate">{product?.name}</p>
                      {attrs && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{attrs}</p>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>
                      {(Number(variant?.price ?? 0) * item.quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

            {/* Coupon */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Tag size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input
                    className="input-inset w-full"
                    style={{ paddingLeft: 34, fontSize: 13 }}
                    placeholder="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponInfo(null); setCouponError('') }}
                  />
                </div>
                <button type="button" onClick={applyCoupon} disabled={applyingCoupon}
                  className="btn-ghost" style={{ flexShrink: 0, padding: '0 16px', fontSize: 13 }}>
                  {applyingCoupon ? <Spinner size={14} /> : 'Áp dụng'}
                </button>
              </div>
              {couponError && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6 }}>{couponError}</p>}
              {couponInfo && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>✓ Giảm {couponInfo.discount_amount.toLocaleString('vi-VN')}₫</p>}
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 16 }} />

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
                <span>{subtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--success)' }}>
                  <span>Giảm giá</span>
                  <span>-{discount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Phí vận chuyển</span>
                <span style={{ color: shippingFee === 0 ? 'var(--success)' : 'var(--text)' }}>
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Tổng cộng</span>
                <span className="neon-text" style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Space Grotesk' }}>
                  {finalTotal.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.3)', fontSize: 13, color: 'var(--error)' }}>
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              form=""
              disabled={submitting}
              className="btn-primary w-full"
              style={{ marginTop: 16, padding: '14px', fontSize: 15, fontWeight: 700, gap: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}
              onClick={handleSubmit as any}
            >
              {submitting
                ? <><Spinner size={16} /> Đang xử lý...</>
                : paymentMethod === 'vnpay' ? 'Đặt hàng & Thanh toán VNPay'
                : paymentMethod === 'momo'  ? 'Đặt hàng & Thanh toán MoMo'
                : <><ShieldCheck size={16} /> Đặt hàng</>}
            </button>

            {/* Trust text */}
            <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
              Bằng việc đặt hàng, bạn đồng ý với{' '}
              <Link to="/chinh-sach/bao-mat" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>Điều khoản dịch vụ</Link>
              {' '}và{' '}
              <Link to="/chinh-sach/bao-mat" style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}>Chính sách bảo mật</Link>
            </p>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <ShieldCheck size={14} style={{ color: 'var(--success)' }} /> Bảo mật SSL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                <RefreshCw size={14} style={{ color: 'var(--neon-blue)' }} /> Đổi trả 30 ngày
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
