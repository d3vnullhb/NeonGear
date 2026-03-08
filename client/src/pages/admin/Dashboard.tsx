import { useEffect, useState } from 'react'
import { Users, Package, ShoppingBag, Tag } from 'lucide-react'
import api from '../../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, categories: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/admin/users?limit=1'),
      api.get('/admin/products?limit=1'),
      api.get('/admin/orders?limit=1'),
      api.get('/admin/categories?limit=1'),
    ]).then(([u, p, o, c]) => {
      setStats({
        users: u.data.pagination?.total ?? 0,
        products: p.data.pagination?.total ?? 0,
        orders: o.data.pagination?.total ?? 0,
        categories: c.data.pagination?.total ?? 0,
      })
    }).catch(() => {})
  }, [])

  const cards = [
    { icon: Users, label: 'Người dùng', value: stats.users, color: 'var(--neon-blue)' },
    { icon: Package, label: 'Sản phẩm', value: stats.products, color: 'var(--neon-cyan)' },
    { icon: ShoppingBag, label: 'Đơn hàng', value: stats.orders, color: 'var(--success)' },
    { icon: Tag, label: 'Danh mục', value: stats.categories, color: 'var(--warning)' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
            </div>
            <p className="text-3xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
