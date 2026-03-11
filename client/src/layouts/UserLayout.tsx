import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScrollToTop from '../components/ScrollToTop'
import CartNotification from '../components/CartNotification'

export default function UserLayout() {
  return (
    <div className="flex flex-col flex-1 w-full min-w-0">
      <Navbar />
      <main className="flex-1 w-full min-w-0 pt-16">
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
      <CartNotification />
    </div>
  )
}
