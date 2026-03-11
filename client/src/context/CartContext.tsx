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
}

interface CartContextType {
  cart: Cart | null
  cartCount: number
  loading: boolean
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
  const [justAdded, setJustAdded] = useState<JustAddedInfo | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchCart = async () => {
    if (!isAuthenticated) { setCart(null); return }
    try {
      setLoading(true)
      const { data } = await api.get('/cart')
      setCart(data.data)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCart() }, [isAuthenticated])

  const addItem = async (variant_id: number, quantity: number, info?: JustAddedInfo) => {
    await api.post('/cart/items', { variant_id, quantity })
    await fetchCart()
    if (info) setJustAdded(info)
  }

  const dismissCart = () => setJustAdded(null)

  const updateItem = async (id: number, quantity: number) => {
    await api.put(`/cart/items/${id}`, { quantity })
    await fetchCart()
  }

  const removeItem = async (id: number) => {
    await api.delete(`/cart/items/${id}`)
    await fetchCart()
  }

  const clearCart = async () => {
    await api.delete('/cart')
    await fetchCart()
  }

  const cartCount = cart?.cart_items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, justAdded, fetchCart, addItem, dismissCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
