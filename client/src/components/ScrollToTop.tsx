import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title="Lên đầu trang"
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--neon-blue)',
        color: '#000',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 14px rgba(0,180,255,0.5), 0 0 28px rgba(0,180,255,0.2)',
        zIndex: 50,
        transition: 'transform 200ms',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
    >
      <ChevronUp size={20} />
    </button>
  )
}
