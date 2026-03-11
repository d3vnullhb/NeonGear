import { useEffect, useState } from 'react'
import { Edit, Warehouse, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function AdminInventory() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [editModal, setEditModal] = useState<any>(null)
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchInventory = () => {
    setLoading(true)
    api.get(`/admin/inventory?page=${page}&limit=30`).then((res) => {
      setInventory(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchInventory() }, [page])

  const openEdit = (item: any) => {
    setEditModal(item); setQty(String(item.quantity)); setNote('')
  }

  const handleSave = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      await api.put(`/admin/inventory/variants/${editModal.variant_id}`, { quantity: parseInt(qty), note })
      setEditModal(null); fetchInventory()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { color: 'var(--error)', bg: 'rgba(255,77,106,0.1)', border: 'rgba(255,77,106,0.25)', label: 'Hết hàng' }
    if (qty <= 10) return { color: 'var(--warning)', bg: 'rgba(255,184,0,0.1)', border: 'rgba(255,184,0,0.25)', label: 'Sắp hết' }
    return { color: 'var(--success)', bg: 'rgba(0,255,157,0.1)', border: 'rgba(0,255,157,0.25)', label: 'Còn hàng' }
  }

  const lowStockCount = inventory.filter(i => i.quantity <= 10).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Kho hàng</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Theo dõi và điều chỉnh tồn kho sản phẩm</p>
        </div>
        {lowStockCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', color: 'var(--warning)', fontSize: 13, fontWeight: 500 }}>
            <AlertTriangle size={14} />
            {lowStockCount} sản phẩm sắp hết / hết hàng
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Sản phẩm', 'SKU', 'Tồn kho', 'Trạng thái', 'Cập nhật', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Warehouse size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    Không có dữ liệu kho hàng
                  </td></tr>
                )}
                {inventory.map((item) => {
                  const stock = getStockStatus(item.quantity)
                  return (
                    <tr key={item.inventory_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{item.product_variants?.products?.name ?? 'N/A'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--muted)', background: 'var(--surface-raised)', padding: '2px 8px', borderRadius: 6 }}>{item.product_variants?.sku}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: stock.color }}>{item.quantity}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: stock.bg, color: stock.color, border: `1px solid ${stock.border}` }}>
                          {stock.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12.5 }}>
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString('vi-VN') : ''}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => openEdit(item)} title="Cập nhật kho" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400, background: p === page ? 'var(--neon-blue)' : 'var(--surface-raised)', color: p === page ? '#000' : 'var(--text)', transition: 'all 150ms' }}
            >{p}</button>
          ))}
        </div>
      )}

      {editModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="card" style={{ padding: 0, width: '100%', maxWidth: 380 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
              <h2 style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Space Grotesk' }}>Cập nhật tồn kho</h2>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>{editModal.product_variants?.products?.name} — <span style={{ fontFamily: 'monospace' }}>{editModal.product_variants?.sku}</span></p>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số lượng mới</label>
                <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="input-inset" style={{ fontSize: 16, fontWeight: 700, textAlign: 'center' }} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Hiện tại: <strong style={{ color: 'var(--text)' }}>{editModal.quantity}</strong></p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ghi chú</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} className="input-inset" style={{ fontSize: 13 }} placeholder="Lý do điều chỉnh..." />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: 13 }}>{saving ? 'Đang lưu...' : 'Cập nhật'}</button>
              <button onClick={() => setEditModal(null)} className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: 13 }}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
