import { RefreshCw } from 'lucide-react'

export default function ReturnPolicy() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <RefreshCw size={28} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
        <h1 style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }} className="text-3xl font-bold">
          Chính sách đổi trả & hoàn tiền
        </h1>
      </div>

      <div className="card p-8 flex flex-col gap-8">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Cập nhật lần cuối: 01/01/2026</p>

        {/* Quick summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Thời gian đổi trả', value: '7 ngày', note: 'kể từ ngày nhận hàng' },
            { label: 'Hoàn tiền', value: '3–5 ngày', note: 'sau khi nhận sản phẩm' },
            { label: 'Hỗ trợ 24/7', value: '1800 NEONGEAR', note: 'miễn phí cuộc gọi' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{item.label}</p>
              <p className="text-base font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>{item.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.note}</p>
            </div>
          ))}
        </div>

        <Section title="1. Điều kiện đổi trả">
          <p>Chúng tôi chấp nhận đổi trả sản phẩm trong các trường hợp sau:</p>
          <ul>
            <li>Sản phẩm bị lỗi kỹ thuật từ nhà sản xuất (không hoạt động, linh kiện hỏng).</li>
            <li>Sản phẩm giao không đúng với mô tả, sai màu sắc hoặc sai model.</li>
            <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển (kèm ảnh chụp minh chứng).</li>
            <li>Sản phẩm còn nguyên seal, chưa qua sử dụng (áp dụng cho đổi size/màu).</li>
          </ul>
        </Section>

        <Section title="2. Điều kiện không được đổi trả">
          <ul>
            <li>Sản phẩm đã qua sử dụng, có dấu hiệu trầy xước hoặc hư hỏng do người dùng.</li>
            <li>Yêu cầu đổi trả sau 7 ngày kể từ ngày nhận hàng.</li>
            <li>Sản phẩm thiếu phụ kiện, hộp hoặc tem bảo hành gốc.</li>
            <li>Sản phẩm thuộc danh mục khuyến mãi cuối mùa (có ghi chú "Không đổi trả").</li>
          </ul>
        </Section>

        <Section title="3. Quy trình đổi trả">
          <ol className="!list-decimal !pl-4 flex flex-col gap-1.5">
            <li>Liên hệ bộ phận CSKH qua email <a href="mailto:support@neongear.vn" style={{ color: 'var(--neon-blue)' }}>support@neongear.vn</a> hoặc hotline <strong>1800 NEONGEAR</strong> trong vòng 7 ngày.</li>
            <li>Cung cấp mã đơn hàng và ảnh chụp sản phẩm lỗi/hư hỏng.</li>
            <li>Đội ngũ xử lý sẽ xác nhận trong vòng 24 giờ làm việc.</li>
            <li>Gửi sản phẩm về địa chỉ kho hàng theo hướng dẫn (NeonGear chịu phí vận chuyển nếu lỗi từ nhà sản xuất).</li>
            <li>Nhận sản phẩm thay thế hoặc hoàn tiền sau 3–5 ngày làm việc.</li>
          </ol>
        </Section>

        <Section title="4. Chính sách hoàn tiền">
          <ul>
            <li><strong>Chuyển khoản ngân hàng:</strong> 3–5 ngày làm việc.</li>
            <li><strong>Ví điện tử (MoMo, VNPay):</strong> 1–2 ngày làm việc.</li>
            <li><strong>Thẻ tín dụng/ghi nợ:</strong> 5–10 ngày làm việc (tùy ngân hàng).</li>
            <li>Phí vận chuyển không được hoàn trả trừ trường hợp lỗi từ phía NeonGear.</li>
          </ul>
        </Section>

        <Section title="5. Bảo hành sản phẩm">
          <p>
            Tất cả sản phẩm tại NeonGear đều có bảo hành chính hãng. Thời gian bảo hành cụ thể được ghi trên trang chi tiết sản phẩm. Để kích hoạt bảo hành, vui lòng đăng ký tại trang web hoặc giữ hóa đơn mua hàng.
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
      <div className="flex flex-col gap-2 text-sm leading-relaxed [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:marker:text-[var(--neon-blue)] [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1.5" style={{ color: 'var(--muted)' }}>
        {children}
      </div>
    </div>
  )
}
