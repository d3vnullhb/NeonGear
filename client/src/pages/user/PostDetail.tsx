import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/posts/${slug}`).then((res) => setPost(res.data.data)).catch(() => navigate('/posts')).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!post) return null

  return (
    <article className="w-full max-w-3xl mx-auto px-4 py-8">
      {post.thumbnail && <img src={post.thumbnail} alt={post.title} className="w-full aspect-video object-cover rounded-2xl mb-6" />}
      {post.category && <span className="badge mb-4 inline-block">{post.category}</span>}
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <div className="flex items-center gap-3 mb-6 text-sm" style={{ color: 'var(--muted)' }}>
        {post.users?.avatar_url && <img src={post.users.avatar_url} className="w-8 h-8 rounded-full object-cover" />}
        <span>{post.users?.full_name}</span>
        <span>·</span>
        <span>{post.published_at ? new Date(post.published_at).toLocaleDateString('vi-VN') : ''}</span>
      </div>
      <div className="prose-sm leading-relaxed" style={{ color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>{post.content}</div>
    </article>
  )
}
