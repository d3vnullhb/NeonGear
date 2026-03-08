import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

interface WishlistContextType {
  wishlistMap: Map<number, number> // product_id → wishlist_id
  isWishlisted: (product_id: number) => boolean
  toggle: (product_id: number, variant_id?: number) => Promise<void>
  loadWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth()
  const [wishlistMap, setWishlistMap] = useState<Map<number, number>>(new Map())

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) { setWishlistMap(new Map()); return }
    try {
      const { data } = await api.get('/wishlist')
      const map = new Map<number, number>()
      for (const item of data.data ?? []) {
        if (item.product_id) map.set(item.product_id, item.wishlist_id)
      }
      setWishlistMap(map)
    } catch {
      // silent
    }
  }, [isAuthenticated])

  useEffect(() => { loadWishlist() }, [loadWishlist])

  const isWishlisted = (product_id: number) => wishlistMap.has(product_id)

  const toggle = async (product_id: number, variant_id?: number) => {
    if (!isAuthenticated) return
    const existing = wishlistMap.get(product_id)
    if (existing) {
      await api.delete(`/wishlist/${existing}`)
      setWishlistMap((prev) => { const m = new Map(prev); m.delete(product_id); return m })
    } else {
      const { data } = await api.post('/wishlist', { product_id, variant_id })
      const newId: number = data.data?.wishlist_id
      setWishlistMap((prev) => new Map(prev).set(product_id, newId))
    }
  }

  return (
    <WishlistContext.Provider value={{ wishlistMap, isWishlisted, toggle, loadWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
