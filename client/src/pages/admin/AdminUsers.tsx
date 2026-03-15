import { useEffect, useState } from 'react'
import { Trash2, Search, Users, LockKeyhole, LockKeyholeOpen } from 'lucide-react'
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
    setPage(1); setQuery(search); fetchUsers(1, search)
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

  const handleToggleLock = async (id: number, currentLocked: boolean) => {
    await api.put(`/admin/users/${id}/lock`, { is_locked: !currentLocked })
    fetchUsers(page)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Space Grotesk' }}>Người dùng</h1>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-raised)', borderRadius: 8, padding: '6px 10px', border: '1px solid var(--border)' }}>
          <Search size={14} style={{ color: 'var(--muted)' }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm người dùng..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', width: 200 }} />
          <button type="submit" style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(0,180,255,0.15)', border: '1px solid rgba(0,180,255,0.3)', color: 'var(--neon-blue)', cursor: 'pointer' }}>Tìm</button>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><Spinner size={40} /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                  {['Người dùng', 'Email', 'Vai trò', 'Ngày tạo', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                    <Users size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
                    Không tìm thấy người dùng
                  </td></tr>
                )}
                {users.map((u) => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 150ms' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,180,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: (u as any).is_locked ? 'rgba(255,77,106,0.15)' : u.role === 'admin' ? 'rgba(0,180,255,0.2)' : 'rgba(107,107,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: (u as any).is_locked ? 'var(--error)' : u.role === 'admin' ? 'var(--neon-blue)' : 'var(--muted)', flexShrink: 0 }}>
                          {u.full_name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.full_name}
                            {(u as any).is_locked && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'rgba(255,77,106,0.15)', color: 'var(--error)', border: '1px solid rgba(255,77,106,0.3)', letterSpacing: '0.03em' }}>Đã khóa</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>#{u.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select value={u.role} onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        style={{ fontSize: 12, padding: '5px 10px', borderRadius: 20, background: u.role === 'admin' ? 'rgba(0,180,255,0.12)' : 'rgba(107,107,138,0.1)', border: u.role === 'admin' ? '1px solid rgba(0,180,255,0.3)' : '1px solid var(--border)', color: u.role === 'admin' ? 'var(--neon-blue)' : 'var(--text)', cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12.5 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggleLock(u.user_id, !!(u as any).is_locked)}
                          title={(u as any).is_locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          style={{ width: 30, height: 30, borderRadius: 7, background: (u as any).is_locked ? 'rgba(255,184,0,0.12)' : 'rgba(107,107,138,0.1)', border: (u as any).is_locked ? '1px solid rgba(255,184,0,0.3)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (u as any).is_locked ? 'var(--warning)' : 'var(--muted)', cursor: 'pointer' }}
                        >
                          {(u as any).is_locked ? <LockKeyholeOpen size={13} /> : <LockKeyhole size={13} />}
                        </button>
                        <button onClick={() => handleDelete(u.user_id)} title="Xoá" style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  )
}
