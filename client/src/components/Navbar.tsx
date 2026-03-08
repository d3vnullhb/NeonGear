import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Menu, X, Search, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <nav style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }} className="sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Zap size={24} style={{ color: 'var(--neon-blue)' }} />
          <span className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--neon-blue)' }}>
            NeonGear
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="input-inset pr-10 text-sm"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Search size={16} />
          </button>
        </form>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/products" style={{ color: 'var(--text)' }} className="hover:text-[var(--neon-blue)] transition-colors">Sản phẩm</Link>
          <Link to="/posts" style={{ color: 'var(--text)' }} className="hover:text-[var(--neon-blue)] transition-colors">Blog</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          {isAuthenticated && (
            <Link to="/wishlist" className="relative" style={{ color: 'var(--text)' }}>
              <Heart size={22} />
            </Link>
          )}

          <Link to="/cart" className="relative" style={{ color: 'var(--text)' }}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="badge absolute -top-2 -right-2">{cartCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative group">
              <button className="flex items-center gap-2 btn-ghost py-2 px-3">
                {user?.avatar_url
                  ? <img src={user.avatar_url} className="w-6 h-6 rounded-full object-cover" />
                  : <User size={18} />}
                <span className="hidden md:inline text-sm">{user?.full_name.split(' ').pop()}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 card w-48 py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <Link to="/profile" className="block px-4 py-2 text-sm hover:text-[var(--neon-blue)] transition-colors">Hồ sơ</Link>
                <Link to="/orders" className="block px-4 py-2 text-sm hover:text-[var(--neon-blue)] transition-colors">Đơn hàng</Link>
                {isAdmin && <Link to="/admin" className="block px-4 py-2 text-sm" style={{ color: 'var(--neon-blue)' }}>Admin</Link>}
                <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />
                <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Đăng nhập</Link>
          )}

          <button className="md:hidden" style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3">
          <form onSubmit={handleSearch} className="flex relative">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input-inset pr-10 text-sm" />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}><Search size={16} /></button>
          </form>
          <Link to="/products" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)' }}>Sản phẩm</Link>
          <Link to="/posts" onClick={() => setMenuOpen(false)} style={{ color: 'var(--text)' }}>Blog</Link>
        </div>
      )}
    </nav>
  )
}
