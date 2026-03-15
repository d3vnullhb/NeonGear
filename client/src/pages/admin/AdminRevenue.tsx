import { useEffect, useState, useCallback } from 'react'
import { TrendingUp, ShoppingBag, Calendar, Clock, Package, Filter } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
  returned: 'Đã trả',
  refunded: 'Đã hoàn tiền',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  pending_cod: 'Chờ thu COD',
}
const STATUS_COLOR: Record<string, string> = {
  pending: '#ffb800',
  confirmed: '#00b4ff',
  processing: '#38bdf8',
  shipping: '#a855f7',
  delivered: '#00ff9d',
  cancelled: '#ff4d6a',
  returned: '#6b6b8a',
  refunded: '#f97316',
  paid: '#22c55e',
  failed: '#ef4444',
  pending_cod: '#eab308',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n)

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

// Use local date (not UTC) to avoid timezone shift issues (e.g. UTC+7 midnight = prev day UTC)
const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const todayStr = () => toLocalDateStr(new Date())

// Check if a YYYY-MM-DD string is a real calendar date (catches 02/29 on non-leap years etc.)
const isValidDate = (str: string): boolean => {
  if (!str || str.length !== 10) return false
  const d = new Date(str)
  return !isNaN(d.getTime()) && toLocalDateStr(d) === str
}

// Given a start date and groupBy, compute the natural end date
const calcEndFromStart = (start: string, gb: GroupBy): string => {
  const d = new Date(start)
  if (isNaN(d.getTime())) return start
  if (gb === 'week') {
    const e = new Date(d); e.setDate(d.getDate() + 6)
    return toLocalDateStr(e)
  }
  if (gb === 'month') {
    return toLocalDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  }
  if (gb === 'quarter') {
    const q = Math.floor(d.getMonth() / 3)
    return toLocalDateStr(new Date(d.getFullYear(), (q + 1) * 3, 0))
  }
  if (gb === 'year') {
    return toLocalDateStr(new Date(d.getFullYear(), 12, 0))
  }
  return start
}

type GroupBy = 'day' | 'week' | 'month' | 'quarter' | 'year'
type Preset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm này' },
  { key: 'custom', label: 'Tùy chỉnh' },
]

const GROUP_BY_OPTIONS: { key: GroupBy; label: string }[] = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'week', label: 'Theo tuần' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'quarter', label: 'Theo quý' },
  { key: 'year', label: 'Theo năm' },
]

function getPresetDates(preset: Preset): { start: string; end: string; groupBy: GroupBy } {
  const now = new Date()
  const today = todayStr()
  if (preset === 'today') {
    return { start: today, end: today, groupBy: 'day' }
  }
  if (preset === 'week') {
    const d = new Date(now)
    d.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
    return { start: toLocalDateStr(d), end: today, groupBy: 'day' }
  }
  if (preset === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: toLocalDateStr(d), end: today, groupBy: 'day' }
  }
  if (preset === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    const d = new Date(now.getFullYear(), q * 3, 1)
    return { start: toLocalDateStr(d), end: today, groupBy: 'month' }
  }
  if (preset === 'year') {
    const d = new Date(now.getFullYear(), 0, 1)
    return { start: toLocalDateStr(d), end: today, groupBy: 'month' }
  }
  // custom default: last 6 months
  const d = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return { start: toLocalDateStr(d), end: today, groupBy: 'month' }
}

export default function AdminRevenue() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [preset, setPreset] = useState<Preset>('month')
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [startDate, setStartDate] = useState(() => getPresetDates('month').start)
  const [endDate, setEndDate] = useState(todayStr())

  const [fetchError, setFetchError] = useState<string | null>(null)

  // Inline validation for custom date inputs
  const startErr = preset === 'custom' && startDate ? (!isValidDate(startDate) ? 'Ngày không hợp lệ' : null) : null
  const endErr = preset === 'custom' && endDate ? (!isValidDate(endDate) ? 'Ngày không hợp lệ' : (!startErr && isValidDate(startDate) && endDate < startDate ? 'Phải sau ngày bắt đầu' : null)) : null

  const fetchData = useCallback((gb: GroupBy, sd: string, ed: string) => {
    if (!isValidDate(sd)) { setFetchError('Ngày bắt đầu không hợp lệ'); return }
    if (!isValidDate(ed)) { setFetchError('Ngày kết thúc không hợp lệ'); return }
    if (sd > ed) { setFetchError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc'); return }
    setFetchError(null)
    setLoading(true)
    api.get('/admin/orders/revenue', { params: { groupBy: gb, startDate: sd, endDate: ed } })
      .then((res) => setData(res.data.data))
      .catch(() => setFetchError('Không thể tải dữ liệu. Vui lòng kiểm tra lại khoảng ngày.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData(groupBy, startDate, endDate)
  }, []) // eslint-disable-line

  const applyPreset = (key: Preset) => {
    setPreset(key)
    if (key !== 'custom') {
      const { start, end, groupBy: gb } = getPresetDates(key)
      setStartDate(start)
      setEndDate(end)
      setGroupBy(gb)
      fetchData(gb, start, end)
    }
  }

  // When startDate changes, auto-recalculate endDate for period-based groupBy
  const onStartDateChange = (val: string) => {
    setStartDate(val)
    if (isValidDate(val) && groupBy !== 'day') {
      setEndDate(calcEndFromStart(val, groupBy))
    }
  }

  // When groupBy changes in custom mode, auto-recalculate endDate from current startDate
  const onGroupByChange = (key: GroupBy) => {
    setGroupBy(key)
    if (preset === 'custom' && key !== 'day' && isValidDate(startDate)) {
      setEndDate(calcEndFromStart(startDate, key))
    }
    if (preset !== 'custom') {
      fetchData(key, startDate, endDate)
    }
  }

  const applyCustom = () => {
    fetchData(groupBy, startDate, endDate)
  }

  const chart: { period: string; revenue: number; orders: number }[] = data?.chart ?? []
  const maxRevenue = Math.max(...chart.map((m) => m.revenue), 1)
  const byStatus: { name: string; count: number }[] = data?.byStatus ?? []
  const totalStatusCount = byStatus.reduce((s, r) => s + r.count, 0)
  const topProducts: { product_name: string; total_quantity: number; total_revenue: number }[] = data?.topProducts ?? []

  const presetLabel = PRESETS.find(p => p.key === preset)?.label ?? ''

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Thống kê doanh thu</h1>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Tổng quan doanh thu và hiệu suất bán hàng</p>
      </div>

      {/* Overview cards — always fixed, not filtered */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Tổng doanh thu', value: data ? fmt(data.totalRevenue) : '—', sub: `${data?.totalOrders ?? 0} đơn`, icon: TrendingUp, color: '#00b4ff' },
          { label: 'Tháng này', value: data ? fmt(data.monthRevenue) : '—', icon: Calendar, color: '#00ff9d' },
          { label: 'Tuần này', value: data ? fmt(data.weekRevenue) : '—', icon: ShoppingBag, color: '#a855f7' },
          { label: 'Hôm nay', value: data ? fmt(data.todayRevenue) : '—', icon: Clock, color: '#ffb800' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={14} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'Space Grotesk', color }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: 'var(--muted)' }} />
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>Khoảng thời gian:</span>
          {PRESETS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12.5, cursor: 'pointer',
                fontWeight: preset === key ? 600 : 400,
                background: preset === key ? 'rgba(0,180,255,0.15)' : 'var(--surface-raised)',
                color: preset === key ? 'var(--neon-blue)' : 'var(--text)',
                border: preset === key ? '1px solid rgba(0,180,255,0.35)' : '1px solid var(--border)',
                transition: 'all 150ms',
              }}
            >{label}</button>
          ))}
        </div>

        {preset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Từ ngày</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <input
                type="date" value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="input-inset"
                style={{ fontSize: 12.5, padding: '5px 10px', width: 150, borderColor: startErr ? 'var(--error)' : undefined }}
              />
              {startErr && <span style={{ fontSize: 11, color: 'var(--error)' }}>{startErr}</span>}
            </div>
            <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>đến ngày</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <input
                type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-inset"
                style={{ fontSize: 12.5, padding: '5px 10px', width: 150, borderColor: endErr ? 'var(--error)' : undefined }}
              />
              {endErr && <span style={{ fontSize: 11, color: 'var(--error)' }}>{endErr}</span>}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>Hiển thị biểu đồ:</span>
          {GROUP_BY_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onGroupByChange(key)}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12.5, cursor: 'pointer',
                fontWeight: groupBy === key ? 600 : 400,
                background: groupBy === key ? 'rgba(168,85,247,0.15)' : 'var(--surface-raised)',
                color: groupBy === key ? '#a855f7' : 'var(--text)',
                border: groupBy === key ? '1px solid rgba(168,85,247,0.35)' : '1px solid var(--border)',
                transition: 'all 150ms',
              }}
            >{label}</button>
          ))}
          {preset === 'custom' && (
            <button
              onClick={applyCustom}
              disabled={!!startErr || !!endErr || !startDate || !endDate}
              className="btn-primary"
              style={{ marginLeft: 8, padding: '5px 16px', fontSize: 12.5, opacity: (startErr || endErr) ? 0.5 : 1, cursor: (startErr || endErr) ? 'not-allowed' : 'pointer' }}
            >Áp dụng</button>
          )}
        </div>
      </div>

      {fetchError && (
        <div style={{ marginBottom: 14, padding: '10px 16px', borderRadius: 8, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', color: 'var(--error)', fontSize: 13 }}>
          {fetchError}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size={40} /></div>
      ) : (
        <>
          {/* Range summary */}
          {data && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
              {[
                { label: `Doanh thu (${presetLabel})`, value: fmt(data.rangeRevenue), color: '#00b4ff' },
                { label: 'Số đơn hàng', value: `${data.rangeOrders} đơn`, color: '#00ff9d' },
                { label: 'Giá trị TB/đơn', value: data.rangeOrders > 0 ? fmt(data.rangeAvg) : '—', color: '#ffb800' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card" style={{ padding: '14px 18px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'Space Grotesk' }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, fontFamily: 'Space Grotesk' }}>
              Biểu đồ doanh thu — {GROUP_BY_OPTIONS.find(g => g.key === groupBy)?.label}
            </h2>
            {chart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '48px 0', fontSize: 13 }}>Không có dữ liệu trong khoảng thời gian này</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, minWidth: chart.length * 48 }}>
                  {chart.map((m) => {
                    const pct = (m.revenue / maxRevenue) * 100
                    return (
                      <div
                        key={m.period}
                        style={{ flex: '0 0 auto', width: Math.max(36, Math.floor(700 / chart.length)), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}
                        title={`${m.period}\nDoanh thu: ${fmt(m.revenue)}\nĐơn hàng: ${m.orders}`}
                      >
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fmtShort(m.revenue)}
                        </div>
                        <div
                          style={{
                            width: '80%', minHeight: 4,
                            height: `${Math.max(pct, 1.5)}%`,
                            background: 'linear-gradient(to top, var(--neon-blue), rgba(0,180,255,0.4))',
                            borderRadius: '4px 4px 0 0',
                            boxShadow: '0 0 8px rgba(0,180,255,0.25)',
                            transition: 'height 400ms ease',
                          }}
                        />
                        <div style={{ fontSize: 9.5, color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.period}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom row: by-status + top products */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* By status */}
            <div className="card" style={{ padding: '20px 24px' }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18, fontFamily: 'Space Grotesk' }}>Đơn hàng theo trạng thái</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {byStatus.map((r) => {
                  const color = STATUS_COLOR[r.name] ?? 'var(--muted)'
                  const pct = totalStatusCount > 0 ? Math.round((r.count / totalStatusCount) * 100) : 0
                  return (
                    <div key={r.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                        <span style={{ color }}>{STATUS_VI[r.name] ?? r.name}</span>
                        <span style={{ fontWeight: 600 }}>{r.count} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 11 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--surface-raised)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 400ms ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                Tổng: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{totalStatusCount} đơn</span>
              </div>
            </div>

            {/* Top products */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={14} style={{ color: 'var(--neon-blue)' }} />
                <h2 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Top 5 sản phẩm bán chạy</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>#</th>
                    <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Sản phẩm</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>SL</th>
                    <th style={{ padding: '8px 14px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--muted)', fontSize: 12.5 }}>Không có dữ liệu</td></tr>
                  )}
                  {topProducts.map((p, i) => (
                    <tr key={p.product_name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: i === 0 ? '#ffb800' : i === 1 ? '#a8a8b3' : i === 2 ? '#cd7f32' : 'var(--muted)', fontSize: 14 }}>{i + 1}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', color: 'var(--neon-blue)', fontWeight: 600 }}>{p.total_quantity}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 600, color: '#00ff9d', whiteSpace: 'nowrap' }}>{fmt(p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
