import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import {
  listPublishedPosts,
  getPostBySlug,
  getPostById,
  listAllPosts,
  createPost,
  updatePost,
  softDeletePost,
} from '../models/post.model'

export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const category = req.query.category as string | undefined
    const [posts, total] = await listPublishedPosts(page, limit, category)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy bài viết thành công', data: posts, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const getPostBySlugHandler = async (req: Request, res: Response) => {
  try {
    const post = await getPostBySlug(req.params.slug as string)
    if (!post) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
      return
    }
    res.json({ success: true, message: 'Lấy bài viết thành công', data: post })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

// Admin
export const adminListPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [posts, total] = await listAllPosts(page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy bài viết thành công', data: posts, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminCreatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { title, slug, content, excerpt, category, is_published } = req.body
    if (!title || !slug || !content) {
      res.status(400).json({ success: false, message: 'title, slug và content là bắt buộc' })
      return
    }
    const thumbnail = (req as any).cloudinaryUrl
    const publish = is_published === 'true' || is_published === true
    const post = await createPost({
      user_id: req.user!.user_id,
      title,
      slug,
      content,
      thumbnail,
      excerpt,
      category,
      is_published: publish,
      published_at: publish ? new Date() : undefined,
    })
    res.status(201).json({ success: true, message: 'Tạo bài viết thành công', data: post })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminUpdatePost = async (req: Request, res: Response) => {
  try {
    const post_id = parseInt(req.params.id as string)
    const existing = await getPostById(post_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
      return
    }
    const data: any = { ...req.body }
    if ((req as any).cloudinaryUrl) data.thumbnail = (req as any).cloudinaryUrl
    if (data.is_published === 'true' || data.is_published === true) {
      data.is_published = true
      if (!existing.published_at) data.published_at = new Date()
    } else if (data.is_published === 'false' || data.is_published === false) {
      data.is_published = false
    }
    const post = await updatePost(post_id, data)
    res.json({ success: true, message: 'Cập nhật bài viết thành công', data: post })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminDeletePost = async (req: Request, res: Response) => {
  try {
    const post_id = parseInt(req.params.id as string)
    const existing = await getPostById(post_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' })
      return
    }
    await softDeletePost(post_id)
    res.json({ success: true, message: 'Xoá bài viết thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
