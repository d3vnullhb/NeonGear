import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

interface RecentPost { post_id: number; title: string; slug: string; thumbnail: string | null; published_at: string | null }

export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentPost[]>([])

  useEffect(() => {
    api.get(`/posts/${slug}`)
      .then(res => setPost(res.data.data))
      .catch(() => navigate('/posts'))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!post) return
    const KEY = 'ng_recent_posts'
    try {
      const prev: RecentPost[] = JSON.parse(localStorage.getItem(KEY) ?? '[]')
      const entry: RecentPost = { post_id: post.post_id, title: post.title, slug: post.slug, thumbnail: post.thumbnail ?? null, published_at: post.published_at ?? null }
      const updated = [entry, ...prev.filter(p => p.post_id !== post.post_id)].slice(0, 8)
      localStorage.setItem(KEY, JSON.stringify(updated))
      setRecentlyViewed(prev.filter(p => p.post_id !== post.post_id).slice(0, 4))
    } catch {}
    api.get('/posts?limit=8')
      .then(r => setRelated((r.data.data ?? []).filter((p: any) => p.post_id !== post.post_id).slice(0, 3)))
      .catch(() => {})
  }, [post?.post_id])

  if (loading) return <div className="flex justify-center py-32"><Spinner size={48} /></div>
  if (!post) return null

  return (
    <>
      {/* Hero — thumbnail with title/author overlaid at bottom */}
      <div style={{ width: '100%', maxWidth: 900, margin: '2rem auto 0', padding: '0 1rem' }}>
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden' }}>
          {post.thumbnail
            ? <img src={post.thumbnail} alt={post.title} style={{ width: '100%', maxHeight: 480, minHeight: 260, objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: 320, background: 'var(--surface-raised)' }} />
          }
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
          {/* Text on image */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem 2rem 1.75rem' }}>
            {post.category && (
              <span className="badge" style={{ display: 'inline-block', marginBottom: 12 }}>{post.category}</span>
            )}
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', lineHeight: 1.25, color: '#fff', marginBottom: '1rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {post.users?.avatar_url
                ? <img src={post.users.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }} />
                : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--neon-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#000' }}>
                    {post.users?.full_name?.[0] ?? 'A'}
                  </div>
              }
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{post.users?.full_name}</span>
              {post.published_at && (
                <>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <article style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '2rem 1rem 2rem' }}>
        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: '1.75rem' }} />

        {/* Content */}
        <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </div>
      </article>

      {(related.length > 0 || recentlyViewed.length > 0) && (
        <div className="w-full max-w-4xl mx-auto px-4 pb-16">

          {/* Related posts */}
          {related.length > 0 && (
            <div style={{ paddingTop: '2.5rem', marginBottom: '2.5rem', borderTop: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', marginBottom: 20 }}>Bài viết liên quan</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {related.map(p => (
                  <Link key={p.post_id} to={`/posts/${p.slug}`} className="card" style={{ textDecoration: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 200ms' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {p.thumbnail && <img src={p.thumbnail} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      {p.category && <span className="badge" style={{ alignSelf: 'flex-start', fontSize: 10 }}>{p.category}</span>}
                      <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{p.title}</p>
                      {p.published_at && <p style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(p.published_at).toLocaleDateString('vi-VN')}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently viewed posts */}
          {recentlyViewed.length > 0 && (
            <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.2rem', marginBottom: 20 }}>Đã xem gần đây</h2>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {recentlyViewed.map(p => (
                  <Link key={p.post_id} to={`/posts/${p.slug}`} className="card" style={{ width: 200, flexShrink: 0, textDecoration: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 200ms' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--surface-raised)' }} />}
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{p.title}</p>
                      {p.published_at && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{new Date(p.published_at).toLocaleDateString('vi-VN')}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </>
  )
}
