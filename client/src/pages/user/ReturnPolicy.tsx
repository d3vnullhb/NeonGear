import { RefreshCw, CheckCircle, XCircle, Clock, CreditCard, Headphones, Shield } from 'lucide-react'

export default function ReturnPolicy() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* ── Hero ── */}
      <div style={{ padding: '3.5rem 0 2.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: 20, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.25)', marginBottom: 24, boxShadow: '0 0 32px rgba(0,180,255,0.15)' }}>
          <RefreshCw size={32} style={{ color: 'var(--neon-blue)' }} />
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
          Chính sách đổi trả<br />
          <span className="neon-text">&amp; hoàn tiền</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 460, margin: '0 auto' }}>
          Mua sắm an tâm — chúng tôi luôn bên bạn nếu có vấn đề xảy ra với sản phẩm.
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, opacity: 0.6 }}>Cập nhật lần cuối: 01/01/2026</p>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { icon: <Clock size={20} />, label: 'Thời gian đổi trả', value: '7 ngày', note: 'kể từ ngày nhận hàng' },
          { icon: <CreditCard size={20} />, label: 'Hoàn tiền', value: '3–5 ngày', note: 'sau khi nhận sản phẩm' },
          { icon: <Headphones size={20} />, label: 'Hỗ trợ 24/7', value: '1800 NEONGEAR', note: 'miễn phí cuộc gọi' },
        ].map(item => (
          <div key={item.label} style={{ padding: '20px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid rgba(0,180,255,0.2)', textAlign: 'center', boxShadow: '0 0 20px rgba(0,180,255,0.06)' }}>
            <div style={{ color: 'var(--neon-blue)', display: 'flex', justifyContent: 'center', marginBottom: 10 }}>{item.icon}</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, color: 'var(--neon-blue)', marginBottom: 4 }}>{item.value}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{item.note}</p>
          </div>
        ))}
      </div>

      {/* ── Sections ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Section 1 */}
        <PolicyCard num="01" title="Điều kiện đổi trả">
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 14 }}>Chúng tôi chấp nhận đổi trả sản phẩm trong các trường hợp sau:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Sản phẩm bị lỗi kỹ thuật từ nhà sản xuất (không hoạt động, linh kiện hỏng).',
              'Sản phẩm giao không đúng với mô tả, sai màu sắc hoặc sai model.',
              'Sản phẩm bị hư hỏng trong quá trình vận chuyển (kèm ảnh chụp minh chứng).',
              'Sản phẩm còn nguyên seal, chưa qua sử dụng (áp dụng cho đổi size/màu).',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </PolicyCard>

        {/* Section 2 */}
        <PolicyCard num="02" title="Điều kiện không được đổi trả">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Sản phẩm đã qua sử dụng, có dấu hiệu trầy xước hoặc hư hỏng do người dùng.',
              'Yêu cầu đổi trả sau 7 ngày kể từ ngày nhận hàng.',
              'Sản phẩm thiếu phụ kiện, hộp hoặc tem bảo hành gốc.',
              'Sản phẩm thuộc danh mục khuyến mãi cuối mùa (có ghi chú "Không đổi trả").',
            ].map(t => (
              <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <XCircle size={15} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </PolicyCard>

        {/* Section 3 - Steps */}
        <PolicyCard num="03" title="Quy trình đổi trả">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { step: 1, text: <>Liên hệ bộ phận CSKH qua email <a href="mailto:support@neongear.vn" style={{ color: 'var(--neon-blue)' }}>support@neongear.vn</a> hoặc hotline <strong style={{ color: 'var(--text)' }}>1800 NEONGEAR</strong> trong vòng 7 ngày.</> },
              { step: 2, text: 'Cung cấp mã đơn hàng và ảnh chụp sản phẩm lỗi/hư hỏng.' },
              { step: 3, text: 'Đội ngũ xử lý sẽ xác nhận trong vòng 24 giờ làm việc.' },
              { step: 4, text: 'Gửi sản phẩm về địa chỉ kho hàng theo hướng dẫn (NeonGear chịu phí vận chuyển nếu lỗi từ nhà sản xuất).' },
              { step: 5, text: 'Nhận sản phẩm thay thế hoặc hoàn tiền sau 3–5 ngày làm việc.' },
            ].map((item, idx, arr) => (
              <div key={item.step} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--neon-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#000', fontFamily: 'Space Grotesk', flexShrink: 0, boxShadow: '0 0 12px rgba(0,180,255,0.4)' }}>
                    {item.step}
                  </div>
                  {idx < arr.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: 'rgba(0,180,255,0.2)', margin: '4px 0' }} />}
                </div>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, paddingBottom: idx < arr.length - 1 ? 20 : 0, paddingTop: 6 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </PolicyCard>

        {/* Section 4 - Refund */}
        <PolicyCard num="04" title="Chính sách hoàn tiền">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 12 }}>
            {[
              { method: 'Chuyển khoản ngân hàng', time: '3–5 ngày làm việc' },
              { method: 'Ví điện tử (MoMo, VNPay)', time: '1–2 ngày làm việc' },
              { method: 'Thẻ tín dụng/ghi nợ', time: '5–10 ngày (tùy ngân hàng)' },
            ].map(r => (
              <div key={r.method} style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{r.method}</p>
                <p style={{ fontSize: 12, color: 'var(--neon-blue)', fontWeight: 600 }}>{r.time}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--warning)', flexShrink: 0 }}>⚠</span>
            Phí vận chuyển không được hoàn trả trừ trường hợp lỗi từ phía NeonGear.
          </p>
        </PolicyCard>

        {/* Section 5 */}
        <PolicyCard num="05" title="Bảo hành sản phẩm">
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <Shield size={36} style={{ color: 'var(--neon-blue)', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
              Tất cả sản phẩm tại NeonGear đều có bảo hành chính hãng. Thời gian bảo hành cụ thể được ghi trên trang chi tiết sản phẩm. Để kích hoạt bảo hành, vui lòng đăng ký tại trang web hoặc giữ hóa đơn mua hàng.
            </p>
          </div>
        </PolicyCard>

      </div>
    </div>
  )
}

function PolicyCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: 13, fontWeight: 800, color: 'var(--neon-blue)', letterSpacing: '0.04em', opacity: 0.7 }}>{num}</span>
        <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  )
}
