import { Request, Response } from 'express'
import {
  listCategories,
  listCategoriesPaginated,
  getCategoryBySlug,
  getCategoryById,
  createCategory,
  updateCategory,
  softDeleteCategory,
} from '../models/category.model'

export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await listCategories()
    res.json({ success: true, message: 'Lấy danh mục thành công', data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getCategoryBySlugHandler = async (req: Request, res: Response) => {
  try {
    const category = await getCategoryBySlug(req.params.slug as string)
    if (!category) {
      res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
      return
    }
    res.json({ success: true, message: 'Lấy danh mục thành công', data: category })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListCategories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [categories, total] = await listCategoriesPaginated(page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy danh mục thành công', data: categories, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminCreateCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, parent_id, is_visible } = req.body
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'name và slug là bắt buộc' })
      return
    }
    if (parent_id) {
      const parent = await getCategoryById(parseInt(parent_id))
      if (!parent) {
        res.status(400).json({ success: false, message: 'Danh mục cha không tồn tại' })
        return
      }
    }
    const image_url = (req as any).cloudinaryUrl
    const category = await createCategory({ name, slug, parent_id, image_url, is_visible })
    res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data: category })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateCategory = async (req: Request, res: Response) => {
  try {
    const category_id = parseInt(req.params.id as string)
    const existing = await getCategoryById(category_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
      return
    }
    const data: any = { ...req.body }
    if ((req as any).cloudinaryUrl) data.image_url = (req as any).cloudinaryUrl
    if (data.parent_id) {
      if (parseInt(data.parent_id) === category_id) {
        res.status(400).json({ success: false, message: 'Danh mục không thể là cha của chính nó' })
        return
      }
      const parent = await getCategoryById(parseInt(data.parent_id))
      if (!parent) {
        res.status(400).json({ success: false, message: 'Danh mục cha không tồn tại' })
        return
      }
    }
    const category = await updateCategory(category_id, data)
    res.json({ success: true, message: 'Cập nhật danh mục thành công', data: category })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteCategory = async (req: Request, res: Response) => {
  try {
    const category_id = parseInt(req.params.id as string)
    const existing = await getCategoryById(category_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' })
      return
    }
    await softDeleteCategory(category_id)
    res.json({ success: true, message: 'Xoá danh mục thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
