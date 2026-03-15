import { Truck, CreditCard, Shield, Zap, Gift, Globe } from 'lucide-react'

export default function ShippingPolicy() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* ── Hero ── */}
      <div style={{ padding: '3.5rem 0 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)', marginBottom: 24, boxShadow: '0 0 32px rgba(0,180,255,0.15)' }}>
          <Truck size={32} style={{ color: 'var(--neon-blue)' }} />
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Chính sách vận chuyển<br />
          <span className="neon-text">&amp; thanh toán</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
          Giao hàng nhanh chóng, thanh toán an toàn — chúng tôi đưa sản phẩm đến tay bạn dễ dàng nhất.
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, opacity: 0.6 }}>Cập nhật lần cuối: 01/01/2026</p>
      </div>

      {/* ── Shipping speeds ── */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Truck size={16} style={{ color: 'var(--neon-blue)' }} /> Tốc độ giao hàng
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { type: 'Tiêu chuẩn', time: '3–5 ngày', fee: 'Từ 30.000đ', note: 'Toàn quốc', icon: <Truck size={18} /> },
            { type: 'Nhanh', time: '1–2 ngày', fee: 'Từ 50.000đ', note: 'HCM & HN', icon: <Zap size={18} /> },
            { type: 'Hỏa tốc', time: 'Trong ngày', fee: 'Từ 80.000đ', note: 'Nội thành HCM & HN', icon: <Zap size={18} /> },
          ].map(item => (
            <div key={item.type} style={{ padding: '20px', borderRadius: 14, background: 'var(--surface)', border: '1px solid rgba(0,180,255,0.2)', boxShadow: '0 0 20px rgba(0,180,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ color: 'var(--neon-blue)' }}>{item.icon}</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{item.type}</span>
              </div>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 24, color: 'var(--neon-blue)', marginBottom: 6 }}>{item.time}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>{item.fee}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{item.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Free shipping */}
        <PolicyCard icon={<Gift size={18} />} title="Miễn phí vận chuyển">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { threshold: '500.000đ', desc: 'Miễn phí vận chuyển tiêu chuẩn cho đơn hàng từ 500.000đ trở lên.' },
              { threshold: '1.000.000đ', desc: 'Miễn phí vận chuyển nhanh cho đơn hàng từ 1.000.000đ trở lên (khu vực HCM & HN).' },
              { threshold: 'Pro', desc: 'Thành viên NeonGear Pro được miễn phí vận chuyển không giới hạn.' },
            ].map(r => (
              <div key={r.threshold} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#000', background: 'var(--neon-blue)', padding: '2px 8px', borderRadius: 6, flexShrink: 0, marginTop: 1, fontFamily: 'Space Grotesk' }}>{r.threshold}</span>
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </PolicyCard>

        {/* Coverage */}
        <PolicyCard icon={<Globe size={18} />} title="Phạm vi giao hàng">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Trong nước</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Tất cả 63 tỉnh thành trên toàn quốc.</p>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)', opacity: 0.6 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Quốc tế</p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Chưa hỗ trợ trong giai đoạn hiện tại.</p>
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginTop: 14 }}>
            NeonGear hợp tác với <strong style={{ color: 'var(--text)' }}>GHTK, GHN</strong> và <strong style={{ color: 'var(--text)' }}>Viettel Post</strong> để đảm bảo hàng hóa được giao nhanh chóng và an toàn. Bạn có thể theo dõi đơn hàng trực tiếp trên trang <a href="/orders" style={{ color: 'var(--neon-blue)' }}>Đơn hàng của tôi</a>.
          </p>
        </PolicyCard>

        {/* Payment methods */}
        <PolicyCard icon={<CreditCard size={18} />} title="Phương thức thanh toán">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { name: 'COD — Thanh toán khi nhận hàng', desc: 'Thanh toán bằng tiền mặt trực tiếp cho shipper. Áp dụng toàn quốc.' },
              { name: 'Thẻ tín dụng / ghi nợ', desc: 'Hỗ trợ VISA, Mastercard, JCB. Giao dịch được mã hóa SSL 256-bit.' },
              { name: 'VNPay', desc: 'Thanh toán qua ví VNPay hoặc quét mã QR tại hơn 40 ngân hàng nội địa.' },
              { name: 'MoMo', desc: 'Thanh toán nhanh qua ví điện tử MoMo. Hỗ trợ chia sẻ hóa đơn.' },
            ].map(item => (
              <div key={item.name} style={{ padding: '16px', borderRadius: 12, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['VISA', 'Mastercard', 'JCB', 'VNPay', 'MoMo', 'COD'].map(m => (
              <span key={m} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--muted)', fontFamily: 'Space Grotesk' }}>{m}</span>
            ))}
          </div>
        </PolicyCard>

        {/* Security */}
        <PolicyCard icon={<Shield size={18} />} title="Bảo mật thanh toán">
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
            Mọi giao dịch tại NeonGear đều được xử lý qua cổng thanh toán bảo mật được mã hóa <strong style={{ color: 'var(--text)' }}>SSL/TLS 256-bit</strong>. NeonGear không lưu trữ thông tin thẻ của bạn trên hệ thống. Nếu phát hiện giao dịch bất thường, vui lòng liên hệ ngay <a href="mailto:support@neongear.vn" style={{ color: 'var(--neon-blue)' }}>support@neongear.vn</a>.
          </p>
        </PolicyCard>

      </div>
    </div>
  )
}

function PolicyCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--neon-blue)' }}>{icon}</span>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}
