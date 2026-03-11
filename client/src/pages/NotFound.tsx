import { Link } from 'react-router-dom'
import { Zap, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={24} style={{ color: 'var(--neon-blue)' }} />
          <span className="text-xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</span>
        </div>

        <div>
          <p className="text-8xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk', lineHeight: 1 }}>404</p>
          <h1 className="text-2xl font-bold mt-4">Trang không tìm thấy</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary flex items-center justify-center gap-2 px-6 py-3">
            <Home size={16} />
            Về trang chủ
          </Link>
          <Link to="/products" className="btn-ghost flex items-center justify-center gap-2 px-6 py-3">
            <Search size={16} />
            Xem sản phẩm
          </Link>
        </div>
      </div>
    </div>
  )
}
