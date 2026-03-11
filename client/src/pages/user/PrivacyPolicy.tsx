import { Shield } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 8px var(--neon-blue))' }} />
        <h1 style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }} className="text-3xl font-bold">
          Chính sách bảo mật
        </h1>
      </div>

      <div className="card p-8 flex flex-col gap-8">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Cập nhật lần cuối: 01/01/2026
        </p>

        <Section title="1. Thông tin chúng tôi thu thập">
          <p>NeonGear thu thập các thông tin sau khi bạn sử dụng dịch vụ:</p>
          <ul>
            <li><strong>Thông tin cá nhân:</strong> họ tên, địa chỉ email, số điện thoại, địa chỉ giao hàng khi bạn đăng ký tài khoản hoặc đặt hàng.</li>
            <li><strong>Thông tin thanh toán:</strong> chúng tôi không lưu trữ thông tin thẻ tín dụng trực tiếp. Mọi giao dịch được xử lý qua cổng thanh toán bên thứ ba được mã hóa.</li>
            <li><strong>Dữ liệu sử dụng:</strong> lịch sử duyệt web, sản phẩm đã xem, giỏ hàng, đơn hàng nhằm cải thiện trải nghiệm cá nhân hóa.</li>
          </ul>
        </Section>

        <Section title="2. Mục đích sử dụng thông tin">
          <ul>
            <li>Xử lý và giao nhận đơn hàng.</li>
            <li>Gửi xác nhận đơn hàng, thông báo vận chuyển và cập nhật tài khoản.</li>
            <li>Gửi chương trình khuyến mãi, ưu đãi dành riêng cho thành viên (bạn có thể hủy đăng ký bất kỳ lúc nào).</li>
            <li>Cải thiện sản phẩm, dịch vụ và trải nghiệm người dùng trên nền tảng.</li>
            <li>Ngăn chặn gian lận và bảo vệ tài khoản của bạn.</li>
          </ul>
        </Section>

        <Section title="3. Chia sẻ thông tin">
          <p>NeonGear <strong>không bán</strong> thông tin cá nhân của bạn cho bên thứ ba. Chúng tôi chỉ chia sẻ trong các trường hợp:</p>
          <ul>
            <li>Đối tác vận chuyển (để thực hiện giao hàng).</li>
            <li>Cổng thanh toán (để xử lý giao dịch tài chính).</li>
            <li>Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp.</li>
          </ul>
        </Section>

        <Section title="4. Bảo mật dữ liệu">
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành bao gồm mã hóa SSL/TLS, kiểm soát truy cập nghiêm ngặt và giám sát hệ thống liên tục để bảo vệ thông tin của bạn khỏi truy cập trái phép, mất mát hoặc tiết lộ.
          </p>
        </Section>

        <Section title="5. Cookie">
          <p>
            NeonGear sử dụng cookie để ghi nhớ phiên đăng nhập, sở thích cá nhân và phân tích hành vi người dùng nhằm cải thiện dịch vụ. Bạn có thể tắt cookie trong cài đặt trình duyệt, tuy nhiên một số tính năng có thể bị ảnh hưởng.
          </p>
        </Section>

        <Section title="6. Quyền của bạn">
          <ul>
            <li>Truy cập, chỉnh sửa thông tin cá nhân trong phần Hồ sơ.</li>
            <li>Yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân.</li>
            <li>Hủy đăng ký nhận email marketing bất kỳ lúc nào.</li>
          </ul>
        </Section>

        <Section title="7. Liên hệ">
          <p>
            Nếu có bất kỳ thắc mắc nào về chính sách bảo mật, vui lòng liên hệ:{' '}
            <a href="mailto:privacy@neongear.vn" style={{ color: 'var(--neon-blue)' }}>privacy@neongear.vn</a>
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
