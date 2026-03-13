import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingCart, Heart, User, Menu, X, Search, Zap, ChevronDown, LogOut, Package, Settings } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const productCategories = [
  { label: 'Tất cả sản phẩm', href: '/products', desc: 'Xem toàn bộ danh mục' },
  { label: 'Chuột Gaming', href: '/products?category=chuot', desc: 'Chuột có dây & không dây' },
  { label: 'Bàn phím', href: '/products?category=ban-phim', desc: 'Cơ, HE, Rapid Trigger' },
  { label: 'Tai nghe', href: '/products?category=tai-nghe', desc: 'Gaming & Hi-Fi' },
]

const navLinks = [
  { label: 'Trang Chủ', href: '/' },
  { label: 'Giới thiệu', href: '/about' },
  { label: 'Sản phẩm', href: '/products', hasDropdown: true },
  { label: 'Bài viết', href: '/posts' },
  { label: 'Liên hệ', href: '/contact' },
  { label: 'Khuyến mãi', href: '/coupons' },
]

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const { cartCount } = useCart()
  const { wishlistMap } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [productDropOpen, setProductDropOpen] = useState(false)
  const [accountDropOpen, setAccountDropOpen] = useState(false)
  const [mobileProductOpen, setMobileProductOpen] = useState(false)

  const productDropRef = useRef<HTMLDivElement>(null)
  const accountDropRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const wishlistCount = wishlistMap.size

  // Close dropdowns on route change
  useEffect(() => {
    setMenuOpen(false)
    setProductDropOpen(false)
    setAccountDropOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (productDropRef.current && !productDropRef.current.contains(e.target as Node)) {
        setProductDropOpen(false)
      }
      if (accountDropRef.current && !accountDropRef.current.contains(e.target as Node)) {
        setAccountDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`)
      setSearch('')
      setSearchOpen(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href.split('?')[0])
  }

  return (
    <nav
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      className="fixed top-0 left-0 right-0 z-50 w-full"
    >
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 items-center" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }}>

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="lg:hidden"
            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Zap size={22} style={{ color: 'var(--neon-blue)' }} />
            <span
              className="text-xl font-bold"
              style={{ fontFamily: 'Space Grotesk', color: 'var(--neon-blue)', letterSpacing: '-0.01em' }}
            >
              NeonGear
            </span>
          </Link>
        </div>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center justify-center gap-10">
          {navLinks.map((link) =>
            link.hasDropdown ? (
              <div key={link.href} className="relative" ref={productDropRef}>
                <button
                  onMouseEnter={() => setProductDropOpen(true)}
                  onClick={() => setProductDropOpen(!productDropOpen)}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all"
                  style={{
                    fontSize: 15,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isActive(link.href) ? 'var(--neon-blue)' : 'var(--text)',
                  }}
                >
                  {link.label}
                  <ChevronDown
                    size={14}
                    style={{
                      transition: 'transform 200ms',
                      transform: productDropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: 'var(--muted)',
                    }}
                  />
                </button>

                {/* Product mega dropdown */}
                {productDropOpen && (
                  <div
                    onMouseLeave={() => setProductDropOpen(false)}
                    className="absolute top-full left-0 mt-2 card animate-fade-in"
                    style={{ minWidth: 260, padding: '8px', zIndex: 100 }}
                  >
                    {productCategories.map((cat) => (
                      <Link
                        key={cat.href}
                        to={cat.href}
                        className="flex flex-col px-3 py-2.5 rounded-lg transition-all"
                        style={{ textDecoration: 'none', color: 'var(--text)' }}
                        onMouseEnter={(e) => {
                          ;(e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--neon-blue)'
                        }}
                        onMouseLeave={(e) => {
                          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                        }}
                      >
                        <span className="text-sm font-semibold">{cat.label}</span>
                        <span className="text-xs" style={{ color: 'var(--muted)', marginTop: 1 }}>{cat.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ fontSize: 15, color: isActive(link.href) ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 justify-end">

          {/* Search toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ background: searchOpen ? 'var(--surface-raised)' : 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
            aria-label="Tìm kiếm"
          >
            <Search size={20} />
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ color: 'var(--text)', textDecoration: 'none' }}
            title="Yêu thích"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-xs font-bold rounded-full"
                style={{
                  background: 'var(--error)',
                  color: '#fff',
                  minWidth: 17,
                  height: 17,
                  fontSize: 10,
                  padding: '0 3px',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors"
            style={{ color: 'var(--text)', textDecoration: 'none' }}
            title="Giỏ hàng"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-xs font-bold rounded-full"
                style={{
                  background: 'linear-gradient(135deg,#00b4ff,#0090d4)',
                  color: '#000',
                  minWidth: 17,
                  height: 17,
                  fontSize: 10,
                  padding: '0 3px',
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          {isAuthenticated ? (
            <div className="relative" ref={accountDropRef}>
              <button
                onClick={() => setAccountDropOpen(!accountDropOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ background: accountDropOpen ? 'var(--surface-raised)' : 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg,#00b4ff,#0090d4)', color: '#000' }}
                  >
                    {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium">
                  {user?.full_name?.split(' ').pop()}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'var(--muted)',
                    transition: 'transform 200ms',
                    transform: accountDropOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {accountDropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 card animate-fade-in"
                  style={{ minWidth: 180, padding: '8px', zIndex: 100 }}
                >
                  <div className="px-3 py-2 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="text-sm font-semibold truncate">{user?.full_name}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--muted)' }}>{user?.email}</div>
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--text)', textDecoration: 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <User size={15} /> Hồ sơ
                  </Link>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: 'var(--text)', textDecoration: 'none' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <Package size={15} /> Đơn hàng
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{ color: 'var(--neon-blue)', textDecoration: 'none' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <Settings size={15} /> Admin
                    </Link>
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0 2px' }} />
                  <button
                    onClick={() => { logout(); setAccountDropOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', textAlign: 'left' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.08)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4 ml-1">Đăng nhập</Link>
          )}
        </div>
      </div>

      {/* Search bar (expandable) */}
      {searchOpen && (
        <div
          className="animate-fade-in px-4 pb-3"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mt-3">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="input-inset pr-10 text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden animate-fade-in px-4 pb-4 flex flex-col gap-1"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="relative mt-3 mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="input-inset pr-10 text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
            >
              <Search size={16} />
            </button>
          </form>

          {/* Mobile nav links */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: isActive('/') ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
          >
            Trang Chủ
          </Link>
          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: isActive('/about') ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
          >
            Giới thiệu
          </Link>

          {/* Products accordion */}
          <div>
            <button
              onClick={() => setMobileProductOpen(!mobileProductOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', textAlign: 'left' }}
            >
              Sản phẩm
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--muted)',
                  transition: 'transform 200ms',
                  transform: mobileProductOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            {mobileProductOpen && (
              <div className="ml-4 flex flex-col gap-1 mt-1">
                {productCategories.map((cat) => (
                  <Link
                    key={cat.href}
                    to={cat.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--muted)', textDecoration: 'none' }}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/posts"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: isActive('/posts') ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
          >
            Bài viết
          </Link>
          <Link
            to="/contact"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: isActive('/contact') ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
          >
            Liên hệ
          </Link>
          <Link
            to="/coupons"
            onClick={() => setMenuOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium"
            style={{ color: isActive('/coupons') ? 'var(--neon-blue)' : 'var(--text)', textDecoration: 'none' }}
          >
            Khuyến mãi
          </Link>
        </div>
      )}
    </nav>
  )
}
