import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  listProductReviews,
  listAllReviews,
  getReviewById,
  getUserProductReview,
  createReview,
  updateReview,
  softDeleteReview,
  approveReview,
  addReviewImages,
  getUserReviewsByProductIds,
} from '../models/review.model'
import { streamToCloudinary } from '../middlewares/upload.middleware'

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const product_id = parseInt(req.params.productId as string)
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [reviews, total] = await listProductReviews(product_id, page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy đánh giá thành công', data: reviews, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const createReviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, order_id, rating, comment } = req.body
    if (!product_id || !rating) {
      res.status(400).json({ success: false, message: 'product_id và rating là bắt buộc' })
      return
    }
    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'rating phải từ 1 đến 5' })
      return
    }

    const existing = await getUserProductReview(req.user!.user_id, parseInt(product_id))
    if (existing) {
      res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi' })
      return
    }

    const review = await createReview({
      product_id: parseInt(product_id),
      user_id: req.user!.user_id,
      order_id: order_id ? parseInt(order_id) : undefined,
      rating: parseInt(rating),
      comment,
    })

    const files = req.files as Express.Multer.File[]
    if (files && files.length) {
      const images = await Promise.all(files.map((f) => streamToCloudinary(f.buffer, 'neongear/reviews')))
      await addReviewImages(review.review_id, images.map((url) => ({ image_url: url })))
    }

    res.status(201).json({ success: true, message: 'Tạo đánh giá thành công', data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const updateReviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const review_id = parseInt(req.params.id as string)
    const review = await getReviewById(review_id)
    if (!review) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
      return
    }
    if (review.user_id !== req.user!.user_id) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    const { rating, comment } = req.body
    if (rating && (rating < 1 || rating > 5)) {
      res.status(400).json({ success: false, message: 'rating phải từ 1 đến 5' })
      return
    }
    const updated = await updateReview(review_id, { rating: rating ? parseInt(rating) : undefined, comment })
    res.json({ success: true, message: 'Cập nhật đánh giá thành công', data: updated })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const deleteReviewHandler = async (req: AuthRequest, res: Response) => {
  try {
    const review_id = parseInt(req.params.id as string)
    const review = await getReviewById(review_id)
    if (!review) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
      return
    }
    if (review.user_id !== req.user!.user_id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    await softDeleteReview(review_id)
    res.json({ success: true, message: 'Xoá đánh giá thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const getMyReviewsForProducts = async (req: AuthRequest, res: Response) => {
  try {
    const raw = req.query.product_ids as string
    if (!raw) { res.json({ success: true, data: [] }); return }
    const product_ids = raw.split(',').map(Number).filter(Boolean)
    const reviews = await getUserReviewsByProductIds(req.user!.user_id, product_ids)
    res.json({ success: true, data: reviews })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

// Admin
export const adminListReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const is_approved = req.query.is_approved !== undefined ? req.query.is_approved === 'true' : undefined
    const [reviews, total] = await listAllReviews(page, limit, is_approved)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy đánh giá thành công', data: reviews, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminApproveReview = async (req: Request, res: Response) => {
  try {
    const review_id = parseInt(req.params.id as string)
    const review = await getReviewById(review_id)
    if (!review) {
      res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' })
      return
    }
    await approveReview(review_id)
    res.json({ success: true, message: 'Duyệt đánh giá thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
