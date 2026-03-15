import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Package, Tag, Bookmark, ShoppingBag,
  Star, Ticket, FileText, MessageSquare, Warehouse, Zap, LogOut, Menu, Sliders, Home, X, ChevronRight, Mail, Tags, BarChart2
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
  { to: '/admin/post-categories', icon: Tags, label: 'Danh mục bài viết' },
  { to: '/admin/contacts', icon: MessageSquare, label: 'Liên hệ' },
  { to: '/admin/inventory', icon: Warehouse, label: 'Kho hàng' },
  { to: '/admin/attributes', icon: Sliders, label: 'Thuộc tính' },
  { to: '/admin/subscribers', icon: Mail, label: 'Đăng ký nhận tin' },
  { to: '/admin/revenue', icon: BarChart2, label: 'Thống kê doanh thu' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', width: 240, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, rgba(0,180,255,0.05), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,180,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,180,255,0.3)' }}>
              <Zap size={18} style={{ color: 'var(--neon-blue)' }} />
            </div>
            <div>
              <div className="font-bold neon-text" style={{ fontFamily: 'Space Grotesk', fontSize: 15, lineHeight: 1.2 }}>NeonGear</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = isActive(to, exact)
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, fontSize: 13.5, fontWeight: active ? 600 : 400,
                background: active ? 'rgba(0,180,255,0.12)' : 'transparent',
                color: active ? 'var(--neon-blue)' : 'var(--text)',
                textDecoration: 'none', transition: 'all 150ms',
                borderLeft: active ? '3px solid var(--neon-blue)' : '3px solid transparent',
                boxShadow: active ? '0 0 10px rgba(0,180,255,0.08)' : 'none',
              }}
              className="admin-nav-item"
            >
              <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={12} style={{ opacity: 0.6 }} />}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--surface-raised)', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--neon-blue)', flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Administrator</div>
            </div>
          </div>
        </div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12.5, color: 'var(--muted)', textDecoration: 'none', marginBottom: 2, transition: 'all 150ms' }} className="admin-nav-item">
          <Home size={13} /> Về trang chủ
        </Link>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, fontSize: 12.5, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: 'all 150ms' }} className="admin-nav-item">
          <LogOut size={13} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to)

  const currentLabel = navItems.find((n) => isActive(n.to, n.exact))?.label ?? 'Admin'
  const CurrentIcon = navItems.find((n) => isActive(n.to, n.exact))?.icon

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ flexShrink: 0, position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start' }}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div style={{ display: 'flex', height: '100%' }}>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px', height: 56 }}>
            <button
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', color: 'var(--neon-blue)', cursor: 'pointer', borderRadius: 8, padding: 6, display: 'flex' }}
            >
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {CurrentIcon && <CurrentIcon size={16} style={{ color: 'var(--neon-blue)' }} />}
              <span style={{ fontWeight: 600, fontSize: 14 }}>{currentLabel}</span>
            </div>
            <div style={{ height: 18, width: 1, background: 'var(--border)', marginLeft: 4 }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>NeonGear Admin</span>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, padding: '24px 20px' }} className="md:p-6">
          <Outlet />
        </div>
      </div>

      <style>{`
        .admin-nav-item:hover {
          background: rgba(0,180,255,0.07) !important;
          color: var(--text) !important;
        }
        .admin-nav-item[style*="var(--neon-blue)"]:hover {
          color: var(--neon-blue) !important;
        }
      `}</style>
    </div>
  )
}
