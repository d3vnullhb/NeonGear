import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  getOrCreateCart,
  getCartWithItems,
  getCartItem,
  getCartItemByVariant,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../models/cart.model'
import { getInventoryByVariant } from '../models/inventory.model'

export const getCart = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await getCartWithItems(req.user!.user_id)
    res.json({ success: true, message: 'Lấy giỏ hàng thành công', data: cart })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { variant_id, quantity } = req.body
    if (!variant_id || !quantity || quantity < 1) {
      res.status(400).json({ success: false, message: 'variant_id và quantity (>=1) là bắt buộc' })
      return
    }

    const inventory = await getInventoryByVariant(parseInt(variant_id))
    if (!inventory || inventory.quantity < quantity) {
      res.status(400).json({ success: false, message: 'Sản phẩm không đủ hàng' })
      return
    }

    const cart = await getOrCreateCart(req.user!.user_id)
    const existing = await getCartItemByVariant(cart.cart_id, parseInt(variant_id))

    let item
    if (existing) {
      const newQty = existing.quantity + parseInt(quantity)
      if (newQty > inventory.quantity) {
        res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' })
        return
      }
      item = await updateCartItem(existing.id, newQty)
    } else {
      item = await addCartItem(cart.cart_id, parseInt(variant_id), parseInt(quantity))
    }

    res.status(201).json({ success: true, message: 'Thêm vào giỏ hàng thành công', data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const updateCartItemHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string)
    const { quantity } = req.body
    if (!quantity || quantity < 1) {
      res.status(400).json({ success: false, message: 'quantity phải >= 1' })
      return
    }

    const item = await getCartItem(id)
    if (!item) {
      res.status(404).json({ success: false, message: 'Không tìm thấy item' })
      return
    }

    const inventory = await getInventoryByVariant(item.variant_id!)
    if (!inventory || inventory.quantity < quantity) {
      res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' })
      return
    }

    const updated = await updateCartItem(id, parseInt(quantity))
    res.json({ success: true, message: 'Cập nhật giỏ hàng thành công', data: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const removeFromCart = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string)
    const item = await getCartItem(id)
    if (!item) {
      res.status(404).json({ success: false, message: 'Không tìm thấy item' })
      return
    }
    await removeCartItem(id)
    res.json({ success: true, message: 'Xoá item khỏi giỏ hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const clearCartHandler = async (req: AuthRequest, res: Response) => {
  try {
    const cart = await getOrCreateCart(req.user!.user_id)
    await clearCart(cart.cart_id)
    res.json({ success: true, message: 'Xoá giỏ hàng thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
