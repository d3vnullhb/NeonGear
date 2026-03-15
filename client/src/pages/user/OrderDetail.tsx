import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, Circle, XCircle, MapPin, CreditCard, Package, ClipboardList, ArrowLeft, Star, Send } from 'lucide-react'
import api from '../../lib/api'
import type { Order } from '../../types'
import Spinner from '../../components/Spinner'

const STATUS_LABELS: Record<string, string> = {
  pending:     'Chờ xử lý',
  processing:  'Đang xử lý',
  confirmed:   'Đã xác nhận',
  shipping:    'Đang giao hàng',
  delivered:   'Đã giao',
  completed:   'Hoàn thành',
  cancelled:   'Đã huỷ',
  refunded:    'Đã hoàn tiền',
  paid:        'Đã thanh toán',
  failed:      'Thanh toán thất bại',
  pending_cod: 'Chờ thanh toán COD',
}

const statusColors: Record<string, { color: string; bg: string; border: string }> = {
  pending:     { color: '#ffb800', bg: 'rgba(255,184,0,0.12)',  border: 'rgba(255,184,0,0.3)'  },
  processing:  { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)', border: 'rgba(0,180,255,0.3)'  },
  confirmed:   { color: '#00b4ff', bg: 'rgba(0,180,255,0.12)', border: 'rgba(0,180,255,0.3)'  },
  shipping:    { color: '#00e5ff', bg: 'rgba(0,229,255,0.12)', border: 'rgba(0,229,255,0.3)'  },
  delivered:   { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  completed:   { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  cancelled:   { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  refunded:    { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  paid:        { color: '#00ff9d', bg: 'rgba(0,255,157,0.12)', border: 'rgba(0,255,157,0.3)'  },
  failed:      { color: '#ff4d6a', bg: 'rgba(255,77,106,0.12)',border: 'rgba(255,77,106,0.3)' },
  pending_cod: { color: '#ffb800', bg: 'rgba(255,184,0,0.12)', border: 'rgba(255,184,0,0.3)'  },
}
const fallbackStatus = { color: '#6b6b8a', bg: 'rgba(107,107,138,0.12)', border: 'rgba(107,107,138,0.3)' }

const PIPELINE = ['pending', 'confirmed', 'shipping', 'delivered']

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'VNPay',
  momo: 'Ví MoMo',
}

interface ReviewedProduct { review_id: number; product_id: number; rating: number; comment: string | null }
interface ReviewForm { rating: number; hoverRating: number; comment: string; submitting: boolean; error: string; done: boolean }

function StarRow({ rating, hover, onRate, onHover, onLeave }: {
  rating: number; hover: number
  onRate: (r: number) => void
  onHover: (r: number) => void
  onLeave: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => {
        const active = i <= (hover || rating)
        return (
          <button key={i} type="button"
            onClick={() => onRate(i)}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={onLeave}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 120ms' }}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.88)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <Star size={26} fill={active ? '#ffb800' : 'none'} style={{ color: active ? '#ffb800' : 'var(--border)', transition: 'color 120ms, fill 120ms' }} />
          </button>
        )
      })}
    </div>
  )
}

const STAR_LABELS = ['', 'Tệ', 'Không thích', 'Bình thường', 'Hài lòng', 'Rất hài lòng!']

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  // Review state
  const [reviewedMap, setReviewedMap] = useState<Record<number, ReviewedProduct>>({})
  const [openReview, setOpenReview] = useState<number | null>(null) // product_id
  const [forms, setForms] = useState<Record<number, ReviewForm>>({})

  const load = () =>
    api.get(`/orders/${id}`).then((res) => setOrder(res.data.data)).catch(() => navigate('/orders'))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  // Load reviewed products when order is delivered
  useEffect(() => {
    if (!order || order.order_status?.name !== 'delivered') return
    const productIds = order.order_details
      .map((d: any) => d.product_variants?.product_id)
      .filter(Boolean) as number[]
    if (!productIds.length) return
    api.get(`/reviews/my-products?product_ids=${productIds.join(',')}`)
      .then(res => {
        const map: Record<number, ReviewedProduct> = {}
        for (const r of (res.data.data ?? [])) map[r.product_id] = r
        setReviewedMap(map)
      })
      .catch(() => {})
  }, [order?.order_id, order?.order_status?.name])

  const handleCancel = async () => {
    if (!confirm('Bạn chắc chắn muốn huỷ đơn hàng?')) return
    setCancelling(true)
    try {
      await api.post(`/orders/${id}/cancel`)
      await load()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Huỷ thất bại')
    } finally {
      setCancelling(false)
    }
  }

  const openReviewForm = (productId: number) => {
    setOpenReview(productId)
    if (!forms[productId]) {
      setForms(prev => ({ ...prev, [productId]: { rating: 5, hoverRating: 0, comment: '', submitting: false, error: '', done: false } }))
    }
  }

  const updateForm = (productId: number, patch: Partial<ReviewForm>) =>
    setForms(prev => ({ ...prev, [productId]: { ...prev[productId], ...patch } }))

  const submitReview = async (productId: number, orderId: number) => {
    const form = forms[productId]
    if (!form || form.rating < 1) { updateForm(productId, { error: 'Vui lòng chọn số sao' }); return }
    updateForm(productId, { submitting: true, error: '' })
    try {
      const fd = new FormData()
      fd.append('product_id', String(productId))
      fd.append('order_id', String(orderId))
      fd.append('rating', String(form.rating))
      if (form.comment.trim()) fd.append('comment', form.comment.trim())
      const res = await api.post('/reviews', fd)
      const newReview = res.data.data
      setReviewedMap(prev => ({ ...prev, [productId]: { review_id: newReview.review_id, product_id: productId, rating: form.rating, comment: form.comment || null } }))
      updateForm(productId, { done: true, submitting: false })
      setOpenReview(null)
    } catch (err: any) {
      updateForm(productId, { submitting: false, error: err.response?.data?.message ?? 'Gửi đánh giá thất bại' })
    }
  }

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!order) return null

  const statusName = order.order_status?.name ?? ''
  const isCancelled = statusName === 'cancelled' || statusName === 'refunded'
  const isDelivered = statusName === 'delivered'
  const statusStyle = statusColors[statusName] ?? fallbackStatus
  const history = order.order_status_history ? [...order.order_status_history].reverse() : []
  const pipelineIdx = PIPELINE.indexOf(statusName)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate('/orders')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, padding: 0 }}
        >
          <ArrowLeft size={14} /> Quay lại đơn hàng
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.2rem,3vw,1.6rem)', fontWeight: 800, margin: 0 }}>
                {order.order_code}
              </h1>
              <span style={{ padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}` }}>
                {STATUS_LABELS[statusName] ?? statusName}
              </span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              {new Date(order.created_at!).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status timeline */}
          <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} style={{ color: 'var(--neon-blue)' }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Trạng thái đơn hàng</h2>
            </div>
            <div style={{ padding: '24px 20px' }}>

              {isCancelled ? (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px', borderRadius: 12, background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.2)' }}>
                  <XCircle size={28} style={{ color: 'var(--error)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--error)', marginBottom: 4 }}>{STATUS_LABELS[statusName] ?? statusName}</p>
                    {history.length > 0 && (
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                        {new Date(history[history.length - 1].changed_at).toLocaleString('vi-VN')}
                        {history[history.length - 1].note && ` — ${history[history.length - 1].note}`}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingBottom: 8 }}>
                  <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 3, background: 'var(--border)', borderRadius: 4, zIndex: 0 }} />
                  <div style={{
                    position: 'absolute', top: 20, left: 20, height: 3, borderRadius: 4,
                    width: pipelineIdx <= 0 ? '0%' : `${(pipelineIdx / (PIPELINE.length - 1)) * (100 - (40 / 4))}%`,
                    background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))',
                    zIndex: 1, maxWidth: 'calc(100% - 40px)', transition: 'width 0.5s ease',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                    {PIPELINE.map((step, idx) => {
                      const done = pipelineIdx >= idx
                      const active = pipelineIdx === idx
                      const stepHistory = history.find((h) => h.order_status?.name === step)
                      return (
                        <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: `${100 / PIPELINE.length}%` }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                            background: done ? 'var(--neon-blue)' : 'var(--surface-raised)',
                            border: `2px solid ${done ? 'var(--neon-blue)' : 'var(--border)'}`,
                            boxShadow: active ? '0 0 16px rgba(0,180,255,0.6)' : 'none',
                          }}>
                            {done ? <CheckCircle size={20} color="#fff" /> : <Circle size={20} style={{ color: 'var(--muted)' }} />}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: done ? 'var(--text)' : 'var(--muted)' }}>
                              {STATUS_LABELS[step]}
                            </p>
                            {stepHistory && (
                              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                                {new Date(stepHistory.changed_at).toLocaleDateString('vi-VN')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* History log */}
              {history.length > 0 && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Lịch sử cập nhật</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {history.map((h) => (
                      <div key={h.history_id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-blue)', flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{STATUS_LABELS[h.order_status?.name ?? ''] ?? h.order_status?.name}</span>
                          {h.note && <span style={{ fontSize: 13, color: 'var(--muted)' }}> — {h.note}</span>}
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
                          {new Date(h.changed_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products */}
          <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} style={{ color: 'var(--neon-blue)' }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                Sản phẩm ({order.order_details.length})
              </h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {order.order_details.map((d: any, idx: number) => {
                const productId = d.product_variants?.product_id as number | undefined
                const imgUrl = d.product_variants?.products?.product_images?.[0]?.image_url
                const already = productId ? reviewedMap[productId] : undefined
                const isOpen = openReview === productId
                const form = productId ? forms[productId] : undefined

                return (
                  <div key={d.order_detail_id}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
                      borderBottom: (idx < order.order_details.length - 1 || isDelivered) ? '1px solid var(--border)' : 'none',
                    }}>
                      {/* Product image */}
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {imgUrl
                          ? <img src={imgUrl} alt={d.product_name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                          : <span style={{ fontSize: 22 }}>🎮</span>}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.product_name}</p>
                        {d.variant_info && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>{d.variant_info}</p>}
                        <p style={{ fontSize: 12, color: 'var(--muted)' }}>x{d.quantity} · {Number(d.price).toLocaleString('vi-VN')}₫/sp</p>
                      </div>
                      {/* Price + review action */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                          {(Number(d.price) * d.quantity).toLocaleString('vi-VN')}₫
                        </p>
                        {isDelivered && productId && (
                          already ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ display: 'flex', gap: 1 }}>
                                {[1,2,3,4,5].map(i => <Star key={i} size={11} fill={i <= already.rating ? '#ffb800' : 'none'} style={{ color: '#ffb800' }} />)}
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Đã đánh giá</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => isOpen ? setOpenReview(null) : openReviewForm(productId)}
                              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: isOpen ? 'rgba(0,180,255,0.15)' : 'rgba(255,184,0,0.1)', border: isOpen ? '1px solid rgba(0,180,255,0.3)' : '1px solid rgba(255,184,0,0.3)', color: isOpen ? 'var(--neon-blue)' : 'var(--warning)', cursor: 'pointer', fontWeight: 600, transition: 'all 150ms' }}
                            >
                              {isOpen ? 'Đóng' : '⭐ Đánh giá ngay'}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Inline review form */}
                    {isDelivered && isOpen && productId && form && !already && (
                      <div style={{ padding: '20px 20px 24px', background: 'rgba(0,180,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Đánh giá sản phẩm: <span style={{ color: 'var(--neon-blue)' }}>{d.product_name}</span></p>

                        {/* Stars */}
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Chất lượng sản phẩm</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StarRow
                              rating={form.rating}
                              hover={form.hoverRating}
                              onRate={(r) => updateForm(productId, { rating: r })}
                              onHover={(r) => updateForm(productId, { hoverRating: r })}
                              onLeave={() => updateForm(productId, { hoverRating: 0 })}
                            />
                            {(form.hoverRating || form.rating) > 0 && (
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>
                                {STAR_LABELS[form.hoverRating || form.rating]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Comment */}
                        <div style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Nhận xét (không bắt buộc)</p>
                          <textarea
                            value={form.comment}
                            onChange={e => updateForm(productId, { comment: e.target.value })}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                            rows={3}
                            style={{
                              width: '100%', boxSizing: 'border-box',
                              background: 'var(--surface-raised)', border: '1px solid var(--border)',
                              borderRadius: 10, padding: '10px 14px', fontSize: 13,
                              color: 'var(--text)', resize: 'none', outline: 'none',
                              fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
                              transition: 'border-color 150ms',
                            }}
                            onFocus={e => (e.target.style.borderColor = 'var(--neon-blue)')}
                            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                          />
                        </div>

                        {form.error && <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 10 }}>{form.error}</p>}

                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setOpenReview(null)}
                            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}
                          >
                            Huỷ
                          </button>
                          <button
                            onClick={() => submitReview(productId, order.order_id)}
                            disabled={form.submitting || form.rating < 1}
                            style={{
                              padding: '8px 20px', borderRadius: 8, border: 'none',
                              background: 'var(--neon-blue)', color: '#000',
                              fontSize: 13, fontWeight: 700, cursor: form.submitting ? 'not-allowed' : 'pointer',
                              opacity: form.submitting ? 0.7 : 1,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <Send size={13} />
                            {form.submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ── Right column (sticky sidebar) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

          {/* Price summary */}
          <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Tóm tắt đơn</h2>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Tạm tính</span>
                <span>{Number(order.total_amount).toLocaleString('vi-VN')}₫</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--success)' }}>
                  <span>Giảm giá</span>
                  <span>-{Number(order.discount_amount).toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--muted)' }}>Phí vận chuyển</span>
                <span>{Number(order.shipping_fee).toLocaleString('vi-VN')}₫</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Tổng cộng</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--neon-blue)' }}>{Number(order.final_amount).toLocaleString('vi-VN')}₫</span>
              </div>
            </div>
          </div>

          {/* Shipping info */}
          <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={15} style={{ color: 'var(--neon-blue)' }} />
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Thông tin giao hàng</h2>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{order.shipping_address}</p>
              {order.payment_method && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <CreditCard size={14} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
                  </span>
                </div>
              )}
              {order.note && (
                <div style={{ paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>Ghi chú: </span>{order.note}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cancel */}
          {statusName === 'pending' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: 'rgba(255,77,106,0.08)', color: 'var(--error)',
                border: '1px solid rgba(255,77,106,0.3)', cursor: cancelling ? 'not-allowed' : 'pointer',
                transition: 'background 200ms', fontFamily: 'Space Grotesk',
              }}
            >
              {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
