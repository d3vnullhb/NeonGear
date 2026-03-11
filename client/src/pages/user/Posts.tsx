import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Calendar, User } from 'lucide-react'
import api from '../../lib/api'
import type { Post } from '../../types'
import Spinner from '../../components/Spinner'

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/posts').then((res) => setPosts(res.data.data ?? [])).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-32"><Spinner size={48} /></div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>

      {/* ── Hero header ── */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '6px 16px', borderRadius: 999, background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.2)' }}>
          <BookOpen size={13} style={{ color: 'var(--neon-blue)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--neon-blue)' }}>Blog & Tin tức</span>
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 700, marginBottom: 12, lineHeight: 1.2 }}>
          Khám phá thế giới<br />
          <span className="neon-text">Gaming Gear</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Reviews, tips & tricks, hướng dẫn setup — tất cả kiến thức bạn cần để nâng tầm trải nghiệm gaming.
        </p>
      </div>

      {/* ── Empty state ── */}
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <BookOpen size={56} style={{ color: 'var(--border)', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Chưa có bài viết nào.</p>
        </div>
      ) : (
        <>
          {/* ── Featured post (first) ── */}
          {posts.length > 0 && (
            <Link
              to={`/posts/${posts[0].slug}`}
              style={{ display: 'block', textDecoration: 'none', marginBottom: 32 }}
              className="card overflow-hidden group"
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 280 }}>
                {/* Thumbnail */}
                <div style={{ overflow: 'hidden', background: 'var(--surface-raised)', position: 'relative' }}>
                  {posts[0].thumbnail
                    ? <img
                        src={posts[0].thumbnail}
                        alt={posts[0].title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 400ms', display: 'block' }}
                        className="group-hover:scale-105"
                      />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0,180,255,0.1), rgba(0,229,255,0.05))' }}>
                        <BookOpen size={64} style={{ color: 'rgba(0,180,255,0.3)' }} />
                      </div>}
                  <div style={{ position: 'absolute', top: 16, left: 16 }}>
                    <span className="badge" style={{ fontSize: 10 }}>Nổi bật</span>
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {posts[0].category && (
                    <span className="badge" style={{ display: 'inline-block', width: 'fit-content', marginBottom: 16, fontSize: 11 }}>
                      {posts[0].category}
                    </span>
                  )}
                  <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(1.1rem, 2vw, 1.4rem)', fontWeight: 700, lineHeight: 1.35, marginBottom: 12, color: 'var(--text)', transition: 'color 200ms' }}
                    className="group-hover:text-[var(--neon-blue)]">
                    {posts[0].title}
                  </h2>
                  {posts[0].excerpt && (
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {posts[0].excerpt}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
                      {posts[0].users?.full_name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} /> {posts[0].users.full_name}
                        </span>
                      )}
                      {posts[0].published_at && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} /> {new Date(posts[0].published_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--neon-blue)' }}>
                      Đọc bài <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ── Grid (remaining posts) ── */}
          {posts.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {posts.slice(1).map((post) => (
                <Link
                  key={post.post_id}
                  to={`/posts/${post.slug}`}
                  style={{ textDecoration: 'none' }}
                  className="card overflow-hidden group block"
                >
                  {/* Thumbnail */}
                  <div style={{ overflow: 'hidden', background: 'var(--surface-raised)' }}>
                    {post.thumbnail
                      ? <img
                          src={post.thumbnail}
                          alt={post.title}
                          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block', transition: 'transform 400ms' }}
                          className="group-hover:scale-105"
                        />
                      : <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0,180,255,0.08), rgba(0,229,255,0.03))' }}>
                          <BookOpen size={40} style={{ color: 'rgba(0,180,255,0.25)' }} />
                        </div>}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    {post.category && (
                      <span className="badge" style={{ fontSize: 10, marginBottom: 10, display: 'inline-block' }}>
                        {post.category}
                      </span>
                    )}
                    <h2
                      style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: 'var(--text)', transition: 'color 200ms', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      className="group-hover:text-[var(--neon-blue)]"
                    >
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)' }}>
                        {post.users?.full_name && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <User size={11} /> {post.users.full_name}
                          </span>
                        )}
                        {post.published_at && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={11} /> {new Date(post.published_at).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <ArrowRight size={14} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
