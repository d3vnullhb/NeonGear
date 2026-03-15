import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'
import CartNotification from '../components/CartNotification'

const ZALO_URL = 'https://zalo.me/450955578960321912'

export default function UserLayout() {
  return (
    <div className="flex flex-col flex-1 w-full min-w-0">
      <Navbar />
      <main className="flex-1 w-full min-w-0" style={{ paddingTop: '64px' }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
      <CartNotification />

      {/* Zalo floating button */}
      <a
        href={ZALO_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 28,
          left: 24,
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'none',
          animation: 'zaloShake 3s ease-in-out infinite',
        }}
        title="Chat Zalo với chúng tôi"
      >
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 4px 16px rgba(0,104,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          border: '2.5px solid #0068ff',
        }}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg"
            alt="Zalo"
            style={{ width: 34, height: 34 }}
          />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#fff',
          background: '#0068ff',
          padding: '2px 8px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0,104,255,0.4)',
          letterSpacing: '0.03em',
        }}>Chat Zalo</span>
      </a>

      <style>{`
        @keyframes zaloShake {
          0%, 60%, 100%  { transform: rotate(0deg); }
          62%            { transform: rotate(-12deg); }
          65%            { transform: rotate(12deg); }
          68%            { transform: rotate(-10deg); }
          71%            { transform: rotate(10deg); }
          74%            { transform: rotate(-6deg); }
          77%            { transform: rotate(6deg); }
          80%            { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
