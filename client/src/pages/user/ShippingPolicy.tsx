import { Truck, CreditCard } from 'lucide-react'

export default function ShippingPolicy() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Truck size={28} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
        <h1 style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }} className="text-3xl font-bold">
          Chính sách thanh toán & vận chuyển
        </h1>
      </div>

      <div className="card p-8 flex flex-col gap-10">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Cập nhật lần cuối: 01/01/2026</p>

        {/* Shipping speed cards */}
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
            Tốc độ giao hàng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { type: 'Tiêu chuẩn', time: '3–5 ngày', fee: 'Từ 30.000đ', note: 'Toàn quốc' },
              { type: 'Nhanh', time: '1–2 ngày', fee: 'Từ 50.000đ', note: 'HCM & HN' },
              { type: 'Hỏa tốc', time: 'Trong ngày', fee: 'Từ 80.000đ', note: 'Nội thành HCM & HN' },
            ].map(item => (
              <div key={item.type} className="rounded-xl p-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Truck size={14} style={{ color: 'var(--neon-blue)' }} />
                  <span className="text-sm font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{item.type}</span>
                </div>
                <p className="text-xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>{item.time}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{item.fee} · {item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <Section title="Miễn phí vận chuyển">
          <ul>
            <li>Miễn phí vận chuyển tiêu chuẩn cho đơn hàng từ <strong>500.000đ</strong> trở lên.</li>
            <li>Miễn phí vận chuyển nhanh cho đơn hàng từ <strong>1.000.000đ</strong> trở lên (khu vực HCM & HN).</li>
            <li>Thành viên NeonGear Pro được miễn phí vận chuyển không giới hạn.</li>
          </ul>
        </Section>

        <Section title="Phạm vi giao hàng">
          <ul>
            <li><strong>Toàn quốc:</strong> tất cả 63 tỉnh thành.</li>
            <li><strong>Quốc tế:</strong> chưa hỗ trợ trong giai đoạn hiện tại.</li>
          </ul>
        </Section>

        <Section title="Đối tác vận chuyển">
          <p>
            NeonGear hợp tác với GHTK, GHN và Viettel Post để đảm bảo hàng hóa được giao nhanh chóng và an toàn trên toàn quốc. Bạn có thể theo dõi đơn hàng trực tiếp trên trang <a href="/orders" style={{ color: 'var(--neon-blue)' }}>Đơn hàng của tôi</a> hoặc qua link tracking trong email xác nhận.
          </p>
        </Section>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Payment section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <CreditCard size={22} style={{ color: 'var(--neon-blue)' }} />
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>Phương thức thanh toán</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              {
                name: 'Thanh toán khi nhận hàng (COD)',
                desc: 'Thanh toán bằng tiền mặt trực tiếp cho shipper khi nhận hàng. Áp dụng toàn quốc.',
              },
              {
                name: 'Thẻ tín dụng / ghi nợ',
                desc: 'Hỗ trợ VISA, Mastercard, JCB. Giao dịch được mã hóa SSL 256-bit.',
              },
              {
                name: 'VNPay',
                desc: 'Thanh toán qua ví VNPay hoặc quét mã QR VNPay tại hơn 40 ngân hàng nội địa.',
              },
              {
                name: 'MoMo',
                desc: 'Thanh toán nhanh qua ví điện tử MoMo. Hỗ trợ chia sẻ hóa đơn.',
              },
            ].map(item => (
              <div key={item.name} className="rounded-xl p-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-bold mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{item.name}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {['VISA', 'Mastercard', 'JCB', 'VNPay', 'MoMo', 'COD'].map(m => (
              <span key={m} className="px-3 py-1 text-xs font-bold rounded-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Space Grotesk' }}>
                {m}
              </span>
            ))}
          </div>
        </div>

        <Section title="Bảo mật thanh toán">
          <p>
            Mọi giao dịch tại NeonGear đều được xử lý qua cổng thanh toán bảo mật được mã hóa SSL/TLS. NeonGear không lưu trữ thông tin thẻ của bạn trên hệ thống. Nếu phát hiện giao dịch bất thường, vui lòng liên hệ ngay <a href="mailto:support@neongear.vn" style={{ color: 'var(--neon-blue)' }}>support@neongear.vn</a>.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:marker:text-[var(--neon-blue)]" style={{ color: 'var(--muted)' }}>
        {children}
      </div>
    </div>
  )
}
