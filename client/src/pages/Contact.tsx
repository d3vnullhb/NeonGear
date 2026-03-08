import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import api from '../lib/api'

export default function Contact() {
  const [form, setForm] = useState({ full_name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/contact', form)
      setSuccess(true)
      setForm({ full_name: '', email: '', subject: '', message: '' })
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gửi thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Liên hệ</h1>
        <p style={{ color: 'var(--muted)' }}>Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info */}
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@neongear.vn' },
            { icon: Phone, label: 'Hotline', value: '1800 1234' },
            { icon: MapPin, label: 'Địa chỉ', value: 'Hà Nội, Việt Nam' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="card p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,180,255,0.1)' }}>
                <Icon size={18} style={{ color: 'var(--neon-blue)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-2 card p-6">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(0,255,157,0.1)' }}>
                <Send size={28} style={{ color: 'var(--success)' }} />
              </div>
              <h3 className="text-xl font-bold mb-2">Đã gửi thành công!</h3>
              <p style={{ color: 'var(--muted)' }} className="text-sm">Chúng tôi sẽ phản hồi trong 24 giờ.</p>
              <button onClick={() => setSuccess(false)} className="btn-ghost mt-6 px-6 py-2 text-sm">Gửi thêm</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm p-3 rounded-lg" style={{ background: 'rgba(255,77,106,0.1)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.2)' }}>
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ tên *</label>
                  <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input-inset text-sm" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-inset text-sm" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-inset text-sm" placeholder="Tiêu đề tin nhắn" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung *</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-inset text-sm" placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..." />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <Send size={16} />
                {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
