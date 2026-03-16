import transporter from '../config/mailer'

const FROM = process.env.SMTP_FROM ?? 'NeonGear <no-reply@neongear.com>'
const BASE_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1117 0%,#12121a 100%);border-radius:16px 16px 0 0;padding:32px 40px;border-bottom:1px solid #1e1e30;text-align:center">
            <div style="display:inline-block">
              <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#ffffff">Neon<span style="color:#00b4ff">Gear</span></span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#12121a;padding:40px;border-radius:0 0 16px 16px;border:1px solid #1e1e30;border-top:none">
            ${content}

            <!-- Footer -->
            <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1e1e30;text-align:center">
              <p style="margin:0;color:#3a3a5c;font-size:12px">© 2025 NeonGear — Gaming Gear Store</p>
              <p style="margin:6px 0 0;color:#3a3a5c;font-size:12px">Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`

export const sendResetPasswordEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`
  await transporter.sendMail({
    from: FROM,
    to,
    subject: '[NeonGear] Đặt lại mật khẩu',
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#0d2035,#0a1628);border:2px solid #00b4ff;margin-bottom:20px">
          <span style="font-size:28px">🔐</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff">Đặt lại mật khẩu</h1>
        <p style="margin:0;color:#6b6b8a;font-size:15px">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
      </div>

      <div style="background:#0d0d15;border:1px solid #1e1e30;border-radius:12px;padding:24px;margin-bottom:28px;text-align:center">
        <p style="margin:0 0 4px;color:#6b6b8a;font-size:13px">Nhấn nút bên dưới để đặt lại mật khẩu</p>
        <p style="margin:0;color:#a0a0b8;font-size:13px">Link có hiệu lực trong <strong style="color:#ffb800">15 phút</strong></p>
      </div>

      <div style="text-align:center;margin-bottom:28px">
        <a href="${resetUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#00b4ff,#0088cc);color:#ffffff;font-weight:700;font-size:16px;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;box-shadow:0 4px 20px rgba(0,180,255,0.35)">
          Đặt lại mật khẩu →
        </a>
      </div>

      <p style="margin:0;color:#3a3a5c;font-size:13px;text-align:center">
        Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.<br>Tài khoản của bạn vẫn an toàn.
      </p>
    `),
  })
}

export const sendOrderConfirmationEmail = async (to: string, order: {
  order_code: string
  final_amount: number
  shipping_address: string
  items: { product_name: string; quantity: number; price: number }[]
}) => {
  const itemRows = order.items.map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a28;color:#e8e8f0;font-size:14px">${i.product_name}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a28;color:#6b6b8a;font-size:14px;text-align:center">×${i.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #1a1a28;color:#00b4ff;font-size:14px;font-weight:600;text-align:right">${(i.price * i.quantity).toLocaleString('vi-VN')}₫</td>
    </tr>
  `).join('')

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `[NeonGear] Xác nhận đơn hàng #${order.order_code}`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#002a15,#001a0d);border:2px solid #00ff9d;margin-bottom:20px">
          <span style="font-size:28px">✅</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff">Đặt hàng thành công!</h1>
        <p style="margin:0;color:#6b6b8a;font-size:15px">Cảm ơn bạn đã tin tưởng NeonGear.</p>
      </div>

      <div style="background:#0d0d15;border:1px solid #1e1e30;border-radius:12px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0;color:#6b6b8a;font-size:12px;text-transform:uppercase;letter-spacing:1px">Mã đơn hàng</p>
        <p style="margin:4px 0 0;color:#00b4ff;font-size:20px;font-weight:700;letter-spacing:1px">#${order.order_code}</p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <thead>
          <tr>
            <th style="padding:8px 0;color:#3a3a5c;font-size:12px;font-weight:600;text-align:left;text-transform:uppercase;letter-spacing:0.8px">Sản phẩm</th>
            <th style="padding:8px 0;color:#3a3a5c;font-size:12px;font-weight:600;text-align:center;text-transform:uppercase;letter-spacing:0.8px">SL</th>
            <th style="padding:8px 0;color:#3a3a5c;font-size:12px;font-weight:600;text-align:right;text-transform:uppercase;letter-spacing:0.8px">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div style="background:linear-gradient(135deg,#0a1628,#0d0d20);border:1px solid #00b4ff33;border-radius:12px;padding:20px;margin-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#6b6b8a;font-size:14px">Tổng thanh toán</td>
            <td style="text-align:right;color:#00b4ff;font-size:22px;font-weight:800">${order.final_amount.toLocaleString('vi-VN')}₫</td>
          </tr>
        </table>
      </div>

      <div style="background:#0d0d15;border:1px solid #1e1e30;border-radius:10px;padding:16px 20px;margin-bottom:28px">
        <p style="margin:0 0 4px;color:#3a3a5c;font-size:12px;text-transform:uppercase;letter-spacing:0.8px">Địa chỉ giao hàng</p>
        <p style="margin:0;color:#a0a0b8;font-size:14px">${order.shipping_address}</p>
      </div>

      <div style="text-align:center">
        <a href="${BASE_URL}/orders"
           style="display:inline-block;background:linear-gradient(135deg,#00b4ff,#0088cc);color:#ffffff;font-weight:700;font-size:15px;padding:13px 36px;border-radius:10px;text-decoration:none;box-shadow:0 4px 20px rgba(0,180,255,0.35)">
          Xem đơn hàng →
        </a>
      </div>
    `),
  })
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao thành công',
  cancelled: 'Đã huỷ',
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#ffb800',
  confirmed: '#00b4ff',
  shipping: '#00e5ff',
  delivered: '#00ff9d',
  cancelled: '#ff4d6a',
}

const STATUS_ICON: Record<string, string> = {
  pending: '🕐',
  confirmed: '✅',
  shipping: '🚚',
  delivered: '🎉',
  cancelled: '❌',
}

const STATUS_BG: Record<string, string> = {
  pending: 'linear-gradient(135deg,#2a1800,#1a1000)',
  confirmed: 'linear-gradient(135deg,#0a1628,#0d0d20)',
  shipping: 'linear-gradient(135deg,#001a2a,#00121e)',
  delivered: 'linear-gradient(135deg,#002a15,#001a0d)',
  cancelled: 'linear-gradient(135deg,#2a0a10,#1a0608)',
}

export const sendOrderStatusEmail = async (to: string, order: {
  order_code: string
  status_name: string
  note?: string
}) => {
  const label = STATUS_LABEL[order.status_name] ?? order.status_name
  const color = STATUS_COLOR[order.status_name] ?? '#00b4ff'
  const icon = STATUS_ICON[order.status_name] ?? '📦'
  const bg = STATUS_BG[order.status_name] ?? 'linear-gradient(135deg,#0a1628,#0d0d20)'

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `[NeonGear] Đơn hàng #${order.order_code} — ${label}`,
    html: emailWrapper(`
      <div style="text-align:center;margin-bottom:32px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${bg};border:2px solid ${color};margin-bottom:20px">
          <span style="font-size:28px">${icon}</span>
        </div>
        <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#ffffff">${label}</h1>
        <p style="margin:0;color:#6b6b8a;font-size:15px">Trạng thái đơn hàng của bạn vừa được cập nhật.</p>
      </div>

      <div style="background:${bg};border:1px solid ${color}33;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;color:#6b6b8a;font-size:12px;text-transform:uppercase;letter-spacing:1px">Mã đơn hàng</p>
        <p style="margin:4px 0 0;color:${color};font-size:22px;font-weight:700;letter-spacing:1px">#${order.order_code}</p>
      </div>

      ${order.note ? `
      <div style="background:#0d0d15;border-left:3px solid ${color};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px">
        <p style="margin:0 0 4px;color:#3a3a5c;font-size:12px;text-transform:uppercase;letter-spacing:0.8px">Ghi chú</p>
        <p style="margin:0;color:#a0a0b8;font-size:14px">${order.note}</p>
      </div>
      ` : ''}

      <div style="text-align:center">
        <a href="${BASE_URL}/orders"
           style="display:inline-block;background:linear-gradient(135deg,${color},${color}aa);color:#0a0a0f;font-weight:700;font-size:15px;padding:13px 36px;border-radius:10px;text-decoration:none">
          Xem đơn hàng →
        </a>
      </div>
    `),
  })
}
