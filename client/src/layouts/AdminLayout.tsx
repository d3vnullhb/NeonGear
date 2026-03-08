import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Package, Tag, Bookmark, ShoppingBag,
  Star, Ticket, FileText, MessageSquare, Warehouse, Zap, LogOut, Menu, Sliders
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/products', icon: Package, label: 'Sản phẩm' },
  { to: '/admin/categories', icon: Tag, label: 'Danh mục' },
  { to: '/admin/brands', icon: Bookmark, label: 'Thương hiệu' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/users', icon: Users, label: 'Người dùng' },
  { to: '/admin/reviews', icon: Star, label: 'Đánh giá' },
  { to: '/admin/coupons', icon: Ticket, label: 'Coupon' },
  { to: '/admin/posts', icon: FileText, label: 'Bài viết' },
  { to: '/admin/contacts', icon: MessageSquare, label: 'Liên hệ' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Kho hàng' },
  { to: '/admin/attributes', icon: Sliders, label: 'Thuộc tính' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const Sidebar = () => (
    <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', width: 220, minHeight: '100vh' }} className="flex flex-col">
      <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Zap size={20} style={{ color: 'var(--neon-blue)' }} />
        <span className="font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear Admin</span>
      </div>
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
              background: isActive(to, exact) ? 'rgba(0,180,255,0.1)' : 'transparent',
              color: isActive(to, exact) ? 'var(--neon-blue)' : 'var(--text)',
              borderLeft: isActive(to, exact) ? '3px solid var(--neon-blue)' : '3px solid transparent',
            }}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{user?.full_name}</div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg transition-colors" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <Sidebar />
          <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3">
          <button className="md:hidden" style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
            {navItems.find((n) => isActive(n.to, n.exact))?.label ?? 'Admin'}
          </h1>
          <Link to="/" className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>← Về trang chủ</Link>
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
