import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Post } from '../types'
import Spinner from '../components/Spinner'

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/posts').then((res) => setPosts(res.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      {posts.length === 0
        ? <p style={{ color: 'var(--muted)' }}>Chưa có bài viết nào.</p>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.post_id} to={`/posts/${post.slug}`} className="card overflow-hidden group block hover:-translate-y-1 transition-transform">
                {post.thumbnail
                  ? <img src={post.thumbnail} alt={post.title} className="w-full aspect-video object-cover" />
                  : <div className="w-full aspect-video flex items-center justify-center text-3xl" style={{ background: 'var(--surface-raised)' }}>📰</div>}
                <div className="p-4">
                  {post.category && <span className="text-xs badge mb-2 inline-block">{post.category}</span>}
                  <h2 className="font-bold text-sm leading-snug mb-2 group-hover:text-[var(--neon-blue)] transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>{post.excerpt}</p>}
                  <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                    <span>{post.users?.full_name}</span>
                    <span>·</span>
                    <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
