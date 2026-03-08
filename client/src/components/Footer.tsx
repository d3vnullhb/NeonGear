import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }} className="mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap size={20} style={{ color: 'var(--neon-blue)' }} />
            <span className="text-lg font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Gaming gear đỉnh cao cho mọi game thủ.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Sản phẩm</h4>
          <div className="flex flex-col gap-2">
            {['Bàn phím', 'Chuột', 'Tai nghe', 'Phụ kiện'].map((item) => (
              <Link key={item} to="/products" className="text-sm transition-colors" style={{ color: 'var(--muted)' }}>{item}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Hỗ trợ</h4>
          <div className="flex flex-col gap-2">
            {[{ label: 'Blog', to: '/posts' }, { label: 'Liên hệ', to: '/contact' }, { label: 'Chính sách', to: '#' }].map((item) => (
              <Link key={item.label} to={item.to} className="text-sm transition-colors" style={{ color: 'var(--muted)' }}>{item.label}</Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm">Tài khoản</h4>
          <div className="flex flex-col gap-2">
            {[{ label: 'Đăng nhập', to: '/login' }, { label: 'Đăng ký', to: '/register' }, { label: 'Đơn hàng', to: '/orders' }].map((item) => (
              <Link key={item.label} to={item.to} className="text-sm transition-colors" style={{ color: 'var(--muted)' }}>{item.label}</Link>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }} className="text-center py-4 text-xs">
        © 2026 NeonGear. Mọi quyền được bảo lưu.
      </div>
    </footer>
  )
}
