import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import { RequireAuth, RequireAdmin, RequireGuest } from './components/ProtectedRoute'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Profile from './pages/Profile'
import Wishlist from './pages/Wishlist'
import Posts from './pages/Posts'
import PostDetail from './pages/PostDetail'
import Contact from './pages/Contact'

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

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
        <WishlistProvider>
          <Routes>
            {/* User layout */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/posts/:slug" element={<PostDetail />} />
              <Route path="/contact" element={<Contact />} />

              {/* Guest only */}
              <Route element={<RequireGuest />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Auth required */}
              <Route element={<RequireAuth />}>
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:id" element={<OrderDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/wishlist" element={<Wishlist />} />
              </Route>
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
              </Route>
            </Route>
          </Routes>
        </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
