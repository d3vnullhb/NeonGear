import { useEffect, useState } from 'react'
import { Trash2, Search } from 'lucide-react'
import api from '../../lib/api'
import type { User, Pagination } from '../../types'
import Spinner from '../../components/Spinner'

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const fetchUsers = (p = 1, q = query) => {
    setLoading(true)
    api.get(`/admin/users?page=${p}&limit=20${q ? `&search=${q}` : ''}`).then((res) => {
      setUsers(res.data.data ?? [])
      setPagination(res.data.pagination)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers(page) }, [page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setQuery(search)
    fetchUsers(1, search)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá người dùng này?')) return
    await api.delete(`/admin/users/${id}`)
    fetchUsers(page)
  }

  const handleRoleChange = async (id: number, role: string) => {
    await api.put(`/admin/users/${id}`, { role })
    fetchUsers(page)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Người dùng</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm..." className="input-inset text-sm w-48" />
          <button type="submit" className="btn-ghost py-2 px-3"><Search size={16} /></button>
        </form>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size={40} /></div> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['ID', 'Họ tên', 'Email', 'Vai trò', 'Ngày tạo', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-xs" style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>#{u.user_id}</td>
                    <td className="px-4 py-3 font-medium">{u.full_name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{u.email}</td>
                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.user_id, e.target.value)} className="text-xs py-1 px-2 rounded" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: u.role === 'admin' ? 'var(--neon-blue)' : 'var(--text)', cursor: 'pointer' }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(u.user_id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={14} /></button>
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
    </div>
  )
}
