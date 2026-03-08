import { useEffect, useState } from 'react'
import { Edit } from 'lucide-react'
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
    setEditModal(item)
    setQty(String(item.quantity))
    setNote('')
  }

  const handleSave = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      await api.put(`/admin/inventory/variants/${editModal.variant_id}`, { quantity: parseInt(qty), note })
      setEditModal(null)
      fetchInventory()
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Kho hàng</h1>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Sản phẩm', 'SKU', 'Tồn kho', 'Cập nhật', ''].map((h) => <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.inventory_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3 font-medium">{item.product_variants?.products?.name ?? 'N/A'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--muted)' }}>{item.product_variants?.sku}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: item.quantity > 10 ? 'var(--success)' : item.quantity > 0 ? 'var(--warning)' : 'var(--error)' }}>{item.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', color: 'var(--neon-blue)', cursor: 'pointer' }}><Edit size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={p === page ? 'btn-primary py-1 px-3 text-sm' : 'btn-ghost py-1 px-3 text-sm'}>{p}</button>
          ))}
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-1">Cập nhật tồn kho</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{editModal.product_variants?.products?.name} — {editModal.product_variants?.sku}</p>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">Số lượng</label><input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="input-inset text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Ghi chú</label><input value={note} onChange={(e) => setNote(e.target.value)} className="input-inset text-sm" placeholder="Lý do điều chỉnh..." /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              <button onClick={() => setEditModal(null)} className="btn-ghost flex-1">Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
