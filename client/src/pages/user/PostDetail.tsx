import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, ChevronRight, BookOpen } from 'lucide-react'
import api from '../../lib/api'
import Spinner from '../../components/Spinner'

const CATEGORY_LABELS: Record<string, string> = {
  news: 'Tin tức', review: 'Đánh giá', guide: 'Hướng dẫn', tips: 'Mẹo hay', update: 'Cập nhật',
}
const CATEGORY_COLORS: Record<string, string> = {
  news: '#00b4ff', review: '#a78bfa', guide: '#00e5ff', tips: '#00ff9d', update: '#ffb800',
}
const getCatLabel = (c: string) => CATEGORY_LABELS[c?.toLowerCase()] ?? c
const getCatColor = (c: string) => CATEGORY_COLORS[c?.toLowerCase()] ?? 'var(--neon-blue)'
const readingTime = (text: string) => Math.max(1, Math.ceil(text.split(/\s+/).length / 200))

// Smart content renderer: detects numbered headings line-by-line
function ContentRenderer({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let paraBuffer: string[] = []
  let key = 0

  const flushPara = () => {
    const content = paraBuffer.filter(l => l.trim()).join('\n')
    if (content) {
      blocks.push(
        <p key={key++} style={{ fontSize: '1rem', lineHeight: 1.9, color: 'rgba(232,232,240,0.88)', marginBottom: '1.1rem', textAlign: 'justify', hyphens: 'auto' }}>
          {content}
        </p>
      )
    }
    paraBuffer = []
  }

  for (const line of lines) {
    const numbered = line.match(/^(\d+)\.\s+(.+)/)
    if (numbered) {
      flushPara()
      blocks.push(
        <div key={key++} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, margin: '2.25rem 0 1rem' }}>
          <span style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: 10,
            background: `${accentColor}18`, border: `1.5px solid ${accentColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: accentColor, fontFamily: 'Space Grotesk', marginTop: 1,
          }}>{numbered[1]}</span>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.15rem', lineHeight: 1.45, color: 'var(--text)', margin: 0, paddingTop: 6 }}>
            {numbered[2]}
          </h2>
        </div>
      )
    } else {
      paraBuffer.push(line)
    }
  }
  flushPara()
  return <>{blocks}</>
}

interface RecentPost { post_id: number; title: string; slug: string; thumbnail: string | null; published_at: string | null }

export default function PostDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState<any[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentPost[]>([])
  const [readProgress, setReadProgress] = useState(0)
  const articleRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const scrolled = Math.max(0, -el.getBoundingClientRect().top)
      setReadProgress(Math.min(100, (scrolled / el.offsetHeight) * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}><Spinner size={48} /></div>
  if (!post) return null

  const catColor = getCatColor(post.category ?? '')
  const mins = readingTime(post.content ?? '')

  return (
    <div style={{ paddingBottom: '6rem' }}>

      {/* Reading progress */}
      <div style={{ position: 'fixed', top: 64, left: 0, right: 0, height: 3, zIndex: 40, background: 'rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${readProgress}%`, background: `linear-gradient(90deg, ${catColor}, var(--neon-cyan))`, transition: 'width 80ms linear', boxShadow: `0 0 10px ${catColor}80` }} />
      </div>

      {/* Back */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.75rem 1.5rem 0' }}>
        <button onClick={() => navigate('/posts')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, padding: 0, transition: 'color 200ms' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
          <ArrowLeft size={14} /> Quay lại bài viết
        </button>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 860, margin: '1.25rem auto 0', padding: '0 1.5rem' }}>
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.65)' }}>
          {post.thumbnail
            ? <img src={post.thumbnail} alt={post.title} style={{ width: '100%', height: 460, objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: 360, background: `linear-gradient(135deg, #0e0e1c 0%, #141428 50%, #0a0a18 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={72} style={{ opacity: 0.06, color: catColor }} />
              </div>
          }
          {/* Layered gradients */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,10,0.97) 0%, rgba(5,5,10,0.65) 38%, rgba(5,5,10,0.15) 65%, transparent 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.35) 100%)' }} />
          {/* Accent glow at bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${catColor}60, transparent)` }} />

          {/* Text */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2.5rem 2.75rem 2.25rem' }}>
            {post.category && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 18, padding: '5px 13px', borderRadius: 20, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', background: `${catColor}22`, color: catColor, border: `1px solid ${catColor}50`, backdropFilter: 'blur(12px)' }}>
                # {getCatLabel(post.category)}
              </span>
            )}
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(1.4rem, 3.2vw, 2.1rem)', lineHeight: 1.3, color: '#fff', marginBottom: '1.5rem', textShadow: '0 2px 24px rgba(0,0,0,0.8)', maxWidth: 640 }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {post.users?.avatar_url
                  ? <img src={post.users.avatar_url} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${catColor}50` }} />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: catColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#000', flexShrink: 0 }}>
                      {post.users?.full_name?.[0] ?? 'A'}
                    </div>
                }
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{post.users?.full_name}</span>
              </div>
              {post.published_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.42)', fontSize: 12.5 }}>
                  <Calendar size={12} /> {new Date(post.published_at).toLocaleDateString('vi-VN')}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.42)', fontSize: 12.5 }}>
                <Clock size={12} /> {mins} phút đọc
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <div ref={articleRef} style={{ maxWidth: 720, margin: '0 auto', padding: '2.75rem 1.5rem 0' }}>

        {/* Excerpt */}
        {post.excerpt && (
          <div style={{ padding: '1.25rem 1.5rem 1.25rem 1.75rem', borderRadius: 14, background: `${catColor}0c`, borderLeft: `3px solid ${catColor}`, marginBottom: '2.5rem', position: 'relative' }}>
            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'rgba(232,232,240,0.85)', lineHeight: 1.75, margin: 0 }}>{post.excerpt}</p>
          </div>
        )}

        {/* First paragraph separator */}
        <div style={{ width: 48, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${catColor}, transparent)`, marginBottom: '2rem' }} />

        {/* Content */}
        <ContentRenderer text={post.content ?? ''} accentColor={catColor} />

        {/* Footer */}
        <div style={{ marginTop: '3.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          {post.category && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}>
              # {getCatLabel(post.category)}
            </span>
          )}
          <Link to="/posts" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--neon-blue)', textDecoration: 'none', fontWeight: 500 }}>
            Xem tất cả bài viết <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Related & Recently viewed */}
      {(related.length > 0 || recentlyViewed.length > 0) && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '4rem 1.5rem 0' }}>

          {related.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ width: 3, height: 18, borderRadius: 2, background: catColor, flexShrink: 0 }} />
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Bài viết liên quan</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {related.map(p => {
                  const c = getCatColor(p.category ?? '')
                  return (
                    <Link key={p.post_id} to={`/posts/${p.slug}`} className="card" style={{ textDecoration: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 200ms, box-shadow 200ms' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = `0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${c}25` }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = ''; el.style.boxShadow = '' }}
                    >
                      {p.thumbnail
                        ? <img src={p.thumbnail} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--surface-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={22} style={{ opacity: 0.12 }} /></div>
                      }
                      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {p.category && <span style={{ alignSelf: 'flex-start', padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', background: `${c}18`, color: c }}>{getCatLabel(p.category)}</span>}
                        <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, margin: 0, lineHeight: 1.4 }}>{p.title}</p>
                        {p.published_at && <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{new Date(p.published_at).toLocaleDateString('vi-VN')}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {recentlyViewed.length > 0 && (
            <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ width: 3, height: 18, borderRadius: 2, background: 'var(--neon-cyan)', flexShrink: 0 }} />
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Đã xem gần đây</h2>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {recentlyViewed.map(p => (
                  <Link key={p.post_id} to={`/posts/${p.slug}`} className="card" style={{ width: 192, flexShrink: 0, textDecoration: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform 200ms' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt={p.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--surface-raised)' }} />}
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, margin: 0, lineHeight: 1.4 }}>{p.title}</p>
                      {p.published_at && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{new Date(p.published_at).toLocaleDateString('vi-VN')}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
