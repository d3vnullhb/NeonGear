import { useEffect, useState } from 'react'
import { Users, Package, ShoppingBag, Tag, TrendingUp, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--warning)',
  confirmed: 'var(--neon-blue)',
  processing: 'var(--neon-blue)',
  shipped: 'var(--neon-cyan)',
  delivered: 'var(--success)',
  cancelled: 'var(--error)',
}

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
}

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, categories: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/users?limit=1'),
      api.get('/admin/products?limit=1'),
      api.get('/admin/orders?limit=1'),
      api.get('/admin/categories?limit=1'),
      api.get('/admin/orders?limit=5&page=1'),
    ]).then(([u, p, o, c, recent]) => {
      setStats({
        users: u.data.pagination?.total ?? 0,
        products: p.data.pagination?.total ?? 0,
        orders: o.data.pagination?.total ?? 0,
        categories: c.data.pagination?.total ?? 0,
      })
      setRecentOrders(recent.data.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const cards = [
    { icon: Users, label: 'Người dùng', value: stats.users, color: 'var(--neon-blue)', bg: 'rgba(0,180,255,0.1)', to: '/admin/users' },
    { icon: Package, label: 'Sản phẩm', value: stats.products, color: 'var(--neon-cyan)', bg: 'rgba(0,229,255,0.1)', to: '/admin/products' },
    { icon: ShoppingBag, label: 'Đơn hàng', value: stats.orders, color: 'var(--success)', bg: 'rgba(0,255,157,0.1)', to: '/admin/orders' },
    { icon: Tag, label: 'Danh mục', value: stats.categories, color: 'var(--warning)', bg: 'rgba(255,184,0,0.1)', to: '/admin/categories' },
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={48} /></div>

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Space Grotesk', marginBottom: 4 }}>Tổng quan</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Chào mừng trở lại! Đây là tình trạng cửa hàng hôm nay.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {cards.map(({ icon: Icon, label, value, color, bg, to }) => (
          <Link key={label} to={to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'transform 150ms, box-shadow 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <ArrowUpRight size={14} style={{ color: 'var(--muted)', marginTop: 4 }} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: 'Space Grotesk', lineHeight: 1 }}>{value.toLocaleString()}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--neon-blue)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Đơn hàng gần đây</span>
          </div>
          <Link to="/admin/orders" style={{ fontSize: 12, color: 'var(--neon-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả <ArrowUpRight size={12} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Chưa có đơn hàng nào.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày đặt'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.order_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/orders/${o.order_id}`} style={{ color: 'var(--neon-blue)', textDecoration: 'none', fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{o.order_code}</Link>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text)' }}>{(o as any).users?.full_name ?? 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{Number(o.final_amount).toLocaleString('vi-VN')}₫</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: `${STATUS_COLORS[o.order_status?.name ?? '']}18`, color: STATUS_COLORS[o.order_status?.name ?? ''] || 'var(--muted)', border: `1px solid ${STATUS_COLORS[o.order_status?.name ?? '']}30` }}>
                        {STATUS_VI[o.order_status?.name ?? ''] ?? o.order_status?.name ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
