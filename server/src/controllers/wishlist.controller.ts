import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { getWishlist, getWishlistItem, addToWishlist, removeFromWishlist, getWishlistById } from '../models/wishlist.model'
import { getProductById } from '../models/product.model'

export const getWishlistHandler = async (req: AuthRequest, res: Response) => {
  try {
    const wishlist = await getWishlist(req.user!.user_id)
    res.json({ success: true, message: 'Lấy danh sách yêu thích thành công', data: wishlist })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const addToWishlistHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, variant_id } = req.body
    if (!product_id) {
      res.status(400).json({ success: false, message: 'product_id là bắt buộc' })
      return
    }

    const product = await getProductById(parseInt(product_id))
    if (!product) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
      return
    }

    const existing = await getWishlistItem(req.user!.user_id, parseInt(product_id))
    if (existing) {
      res.status(400).json({ success: false, message: 'Sản phẩm đã có trong danh sách yêu thích' })
      return
    }

    const item = await addToWishlist(req.user!.user_id, parseInt(product_id), variant_id ? parseInt(variant_id) : undefined)
    res.status(201).json({ success: true, message: 'Thêm vào yêu thích thành công', data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const removeFromWishlistHandler = async (req: AuthRequest, res: Response) => {
  try {
    const wishlist_id = parseInt(req.params.id as string)
    const item = await getWishlistById(wishlist_id)
    if (!item || item.user_id !== req.user!.user_id) {
      res.status(404).json({ success: false, message: 'Không tìm thấy item' })
      return
    }
    await removeFromWishlist(wishlist_id)
    res.json({ success: true, message: 'Xoá khỏi yêu thích thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
