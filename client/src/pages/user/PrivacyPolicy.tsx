import { Shield, Database, Share2, Lock, Cookie, UserCheck, Mail } from 'lucide-react'

const SECTIONS = [
  {
    icon: <Database size={18} />,
    title: '1. Thông tin chúng tôi thu thập',
    content: (
      <>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.7 }}>NeonGear thu thập các thông tin sau khi bạn sử dụng dịch vụ:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Thông tin cá nhân', desc: 'Họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng khi bạn đăng ký tài khoản hoặc đặt hàng.' },
            { label: 'Thông tin thanh toán', desc: 'Chúng tôi không lưu trữ thông tin thẻ tín dụng trực tiếp. Mọi giao dịch được xử lý qua cổng thanh toán bên thứ ba được mã hóa.' },
            { label: 'Dữ liệu sử dụng', desc: 'Lịch sử duyệt web, sản phẩm đã xem, giỏ hàng, đơn hàng nhằm cải thiện trải nghiệm cá nhân hóa.' },
          ].map(r => (
            <div key={r.label} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{r.label}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</p>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    icon: <UserCheck size={18} />,
    title: '2. Mục đích sử dụng thông tin',
    content: (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Xử lý và giao nhận đơn hàng.',
          'Gửi xác nhận đơn hàng, thông báo vận chuyển và cập nhật tài khoản.',
          'Gửi chương trình khuyến mãi, ưu đãi dành riêng cho thành viên (bạn có thể hủy đăng ký bất kỳ lúc nào).',
          'Cải thiện sản phẩm, dịch vụ và trải nghiệm người dùng trên nền tảng.',
          'Ngăn chặn gian lận và bảo vệ tài khoản của bạn.',
        ].map(t => (
          <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-blue)', flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: <Share2 size={18} />,
    title: '3. Chia sẻ thông tin',
    content: (
      <>
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,255,157,0.05)', border: '1px solid rgba(0,255,157,0.2)', marginBottom: 14 }}>
          <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>NeonGear <span style={{ color: 'var(--success)' }}>không bán</span> thông tin cá nhân của bạn cho bên thứ ba.</p>
        </div>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>Chúng tôi chỉ chia sẻ trong các trường hợp:</p>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {['Đối tác vận chuyển (để thực hiện giao hàng).', 'Cổng thanh toán (để xử lý giao dịch tài chính).', 'Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.'].map(t => (
            <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-blue)', flexShrink: 0, marginTop: 7 }} />
              <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    icon: <Lock size={18} />,
    title: '4. Bảo mật dữ liệu',
    content: (
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
        Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm <strong style={{ color: 'var(--text)' }}>mã hóa SSL/TLS</strong>, kiểm soát truy cập nghiêm ngặt và giám sát hệ thống liên tục để bảo vệ thông tin của bạn khỏi truy cập trái phép, mất mát hoặc tiết lộ.
      </p>
    ),
  },
  {
    icon: <Cookie size={18} />,
    title: '5. Cookie',
    content: (
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
        NeonGear sử dụng cookie để ghi nhớ phiên đăng nhập, sở thích cá nhân và phân tích hành vi người dùng nhằm cải thiện dịch vụ. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể bị ảnh hưởng.
      </p>
    ),
  },
  {
    icon: <UserCheck size={18} />,
    title: '6. Quyền của bạn',
    content: (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[
          'Truy cập, chỉnh sửa thông tin cá nhân trong phần Hồ sơ.',
          'Yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân.',
          'Hủy đăng ký nhận email marketing bất kỳ lúc nào.',
        ].map(t => (
          <li key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon-blue)', flexShrink: 0, marginTop: 7 }} />
            <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    icon: <Mail size={18} />,
    title: '7. Liên hệ',
    content: (
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
        Nếu có bất kỳ thắc mắc nào về chính sách bảo mật, vui lòng liên hệ:{' '}
        <a href="mailto:privacy@neongear.vn" style={{ color: 'var(--neon-blue)' }}>privacy@neongear.vn</a>
      </p>
    ),
  },
]

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* ── Hero ── */}
      <div style={{ padding: '3.5rem 0 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)', marginBottom: 24, boxShadow: '0 0 32px rgba(0,180,255,0.15)' }}>
          <Shield size={32} style={{ color: 'var(--neon-blue)' }} />
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Chính sách<br />
          <span className="neon-text">bảo mật</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
          Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo tiêu chuẩn bảo mật cao nhất.
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, opacity: 0.6 }}>Cập nhật lần cuối: 01/01/2026</p>
      </div>

      {/* ── Sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SECTIONS.map(s => (
          <div key={s.title} style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--neon-blue)' }}>{s.icon}</span>
              <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{s.title}</h2>
            </div>
            <div style={{ padding: '20px 24px' }}>{s.content}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
