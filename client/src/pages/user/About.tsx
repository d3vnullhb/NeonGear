import { Link } from 'react-router-dom'
import { Zap, Shield, Truck, Headphones, Award, Users } from 'lucide-react'

const stats = [
  { value: '2.000+', label: 'Khách hàng tin tưởng' },
  { value: '150+', label: 'Sản phẩm chính hãng' },
  { value: '5+', label: 'Năm kinh nghiệm' },
  { value: '98%', label: 'Phản hồi tích cực' },
]

const values = [
  {
    icon: <Shield size={28} />,
    title: 'Hàng chính hãng 100%',
    desc: 'Toàn bộ sản phẩm được nhập khẩu trực tiếp từ các thương hiệu uy tín, có đầy đủ tem bảo hành và giấy tờ chứng nhận.',
  },
  {
    icon: <Truck size={28} />,
    title: 'Giao hàng toàn quốc',
    desc: 'Hỗ trợ giao hàng đến tất cả 63 tỉnh thành. Giao nhanh 2h nội thành TP. Cần Thơ, 1–3 ngày các tỉnh còn lại.',
  },
  {
    icon: <Headphones size={28} />,
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ tư vấn viên am hiểu sản phẩm, luôn sẵn sàng giải đáp mọi thắc mắc qua hotline, chat và email.',
  },
  {
    icon: <Award size={28} />,
    title: 'Bảo hành tận tâm',
    desc: 'Chính sách bảo hành rõ ràng, hỗ trợ đổi trả trong 30 ngày nếu sản phẩm có lỗi kỹ thuật từ nhà sản xuất.',
  },
]

export default function About() {
  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 2rem 5rem' }}>

      {/* Hero */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Zap size={36} style={{ color: 'var(--neon-blue)', filter: 'drop-shadow(0 0 10px var(--neon-blue))' }} />
          <h1 className="text-4xl font-bold neon-text" style={{ fontFamily: 'Space Grotesk' }}>NeonGear</h1>
        </div>
        <p className="text-xl font-medium mb-3" style={{ color: 'var(--text)' }}>
          Nâng tầm trải nghiệm gaming của bạn
        </p>
        <p className="text-base leading-relaxed mx-auto" style={{ color: 'var(--muted)', maxWidth: 640 }}>
          NeonGear là cửa hàng chuyên cung cấp thiết bị gaming cao cấp — bàn phím, chuột, tai nghe — cho game thủ Việt Nam.
          Chúng tôi tin rằng gear đúng sẽ tạo nên sự khác biệt trong từng trận đấu.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        style={{ borderRadius: 16, padding: '2rem', background: 'linear-gradient(135deg,rgba(0,180,255,0.06),rgba(0,229,255,0.03))' , border: '1px solid rgba(0,180,255,0.15)' }}
      >
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-bold neon-text mb-1" style={{ fontFamily: 'Space Grotesk' }}>{s.value}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Story */}
      <div className="card mb-16" style={{ padding: '2.5rem' }}>
        <h2 className="section-heading mb-6">Câu chuyện của chúng tôi</h2>
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col gap-4 text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p>
              NeonGear được thành lập năm 2020 bởi một nhóm game thủ đam mê tại TP. Cần Thơ — những người hiểu rõ
              cảm giác bực bội khi dùng gear kém chất lượng và khó khăn khi tìm mua hàng chính hãng ở Việt Nam.
            </p>
            <p>
              Từ một cửa hàng nhỏ trên đường Nguyễn Văn Cừ, chúng tôi đã phát triển thành nền tảng thương mại điện tử
              phục vụ hàng nghìn game thủ trên khắp cả nước, với cam kết không đổi: <strong style={{ color: 'var(--text)' }}>hàng thật, giá tốt, dịch vụ tận tâm.</strong>
            </p>
            <p>
              Mỗi sản phẩm trên NeonGear đều được đội ngũ kiểm tra kỹ lưỡng trước khi đến tay khách hàng.
              Chúng tôi không chỉ bán gear — chúng tôi đồng hành cùng game thủ Việt.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div
              className="flex items-center justify-center"
              style={{
                width: 220, height: 220, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,180,255,0.15) 0%, rgba(0,180,255,0.03) 70%)',
                border: '2px solid rgba(0,180,255,0.2)',
                boxShadow: '0 0 40px rgba(0,180,255,0.15)',
              }}
            >
              <Users size={80} style={{ color: 'var(--neon-blue)', opacity: 0.8 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <h2 className="section-heading mb-8">Giá trị cốt lõi</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map(v => (
            <div key={v.title} className="card-raised flex flex-col gap-3 p-5">
              <div style={{ color: 'var(--neon-blue)' }}>{v.icon}</div>
              <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>{v.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="text-center"
        style={{ padding: '3rem', borderRadius: 16, background: 'linear-gradient(135deg,rgba(0,180,255,0.08),rgba(0,229,255,0.04))', border: '1px solid rgba(0,180,255,0.2)' }}
      >
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Space Grotesk', color: 'var(--text)' }}>
          Sẵn sàng nâng cấp setup của bạn?
        </h2>
        <p className="mb-6" style={{ color: 'var(--muted)' }}>Khám phá hàng trăm sản phẩm gaming chính hãng tại NeonGear.</p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link to="/products" className="btn-primary">Xem sản phẩm</Link>
          <Link to="/contact" className="btn-ghost">Liên hệ chúng tôi</Link>
        </div>
      </div>

    </div>
  )
}
