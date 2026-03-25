import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Cart } from '../types'
import api from '../lib/api'
import { useAuth } from './AuthContext'

export interface JustAddedInfo {
  name: string
  image_url?: string
  price: number | string
  variant_name?: string
  slug: string
  cartQuantity?: number
}

interface CartContextType {
  cart: Cart | null
  cartCount: number
  loading: boolean
  cartError: string | null
  justAdded: JustAddedInfo | null
  fetchCart: () => Promise<void>
  addItem: (variant_id: number, quantity: number, info?: JustAddedInfo) => Promise<void>
  dismissCart: () => void
  updateItem: (id: number, quantity: number) => Promise<void>
  removeItem: (id: number) => Promise<void>
  clearCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<JustAddedInfo | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchCart = async () => {
    if (!isAuthenticated) { setCart(null); return }
    try {
      setLoading(true)
      setCartError(null)
      const { data } = await api.get('/cart')
      setCart(data.data)
    } catch (err: any) {
      setCart(null)
      // 401 = user not authenticated — normal state, do not show error
      if (err?.response?.status === 401) {
        setCartError(null)
      } else {
        setCartError('Không thể tải giỏ hàng, vui lòng thử lại')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, [isAuthenticated])

  const addItem = async (variant_id: number, quantity: number, info?: JustAddedInfo) => {
    try {
      const { data: res } = await api.post('/cart/items', { variant_id, quantity })
      const cartQuantity: number = res.data?.quantity ?? quantity
      await fetchCart()
      if (info) setJustAdded({ ...info, cartQuantity })
    } catch (err) {
      throw err
    }
  }

  const dismissCart = () => setJustAdded(null)

  const updateItem = async (id: number, quantity: number) => {
    try {
      await api.put(`/cart/items/${id}`, { quantity })
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  const removeItem = async (id: number) => {
    try {
      await api.delete(`/cart/items/${id}`)
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  const clearCart = async () => {
    try {
      await api.delete('/cart')
      await fetchCart()
    } catch (err) {
      throw err
    }
  }

  const cartCount = cart?.cart_items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, cartError, justAdded, fetchCart, addItem, dismissCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
