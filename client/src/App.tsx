import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import { RequireAuth, RequireAdmin, RequireGuest } from './components/ProtectedRoute'
import RouteScrollTop from './components/RouteScrollTop'

import Home from './pages/user/Home'
import Products from './pages/user/Products'
import ProductDetail from './pages/user/ProductDetail'
import Login from './pages/user/Login'
import Register from './pages/user/Register'
import Cart from './pages/user/Cart'
import Checkout from './pages/user/Checkout'
import Orders from './pages/user/Orders'
import OrderDetail from './pages/user/OrderDetail'
import Profile from './pages/user/Profile'
import Wishlist from './pages/user/Wishlist'
import Posts from './pages/user/Posts'
import PostDetail from './pages/user/PostDetail'
import Contact from './pages/user/Contact'
import ForgotPassword from './pages/user/ForgotPassword'
import ResetPassword from './pages/user/ResetPassword'
import PrivacyPolicy from './pages/user/PrivacyPolicy'
import ReturnPolicy from './pages/user/ReturnPolicy'
import ShippingPolicy from './pages/user/ShippingPolicy'
import PaymentResult from './pages/user/PaymentResult'
import Coupons from './pages/user/Coupons'
import About from './pages/user/About'
import NotFound from './pages/NotFound'

import Dashboard from './pages/admin/Dashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminProductVariants from './pages/admin/AdminProductVariants'
import AdminCategories from './pages/admin/AdminCategories'
import AdminBrands from './pages/admin/AdminBrands'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminReviews from './pages/admin/AdminReviews'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminPosts from './pages/admin/AdminPosts'
import AdminContacts from './pages/admin/AdminContacts'
import AdminInventory from './pages/admin/AdminInventory'
import AdminAttributes from './pages/admin/AdminAttributes'
import AdminSubscribers from './pages/admin/AdminSubscribers'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

function AppRoutes() {
  return (
    <BrowserRouter>
      <RouteScrollTop />
      <AuthProvider>
        <CartProvider>
        <WishlistProvider>
          <Routes>
            {/* User layout */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/:slug" element={<PostDetail />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/coupons" element={<Coupons />} />

              {/* Guest only */}
              <Route element={<RequireGuest />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/chinh-sach/bao-mat" element={<PrivacyPolicy />} />
              <Route path="/chinh-sach/doi-tra-hoan-tien" element={<ReturnPolicy />} />
              <Route path="/chinh-sach/thanh-toan-van-chuyen" element={<ShippingPolicy />} />
              <Route path="/payment/result" element={<PaymentResult />} />

              {/* Auth required */}
              <Route element={<RequireAuth />}>
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/wishlist" element={<Wishlist />} />
              </Route>
            </Route>

            {/* Standalone Checkout — no Navbar/Footer */}
            <Route element={<RequireAuth />}>
              <Route path="/checkout" element={<Checkout />} />
            </Route>

            {/* Admin layout */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/products/:id/variants" element={<AdminProductVariants />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/posts" element={<AdminPosts />} />
                <Route path="/admin/contacts" element={<AdminContacts />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/attributes" element={<AdminAttributes />} />
                <Route path="/admin/subscribers" element={<AdminSubscribers />} />
              </Route>
            </Route>
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default function App() {
  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}><AppRoutes /></GoogleOAuthProvider>
  }
  return <AppRoutes />
}
