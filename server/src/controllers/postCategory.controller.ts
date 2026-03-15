import { Request, Response } from 'express'
import { listPostCategories, createPostCategory, updatePostCategory, deletePostCategory } from '../models/postCategory.model'

export const getPostCategories = async (_req: Request, res: Response) => {
  try {
    const data = await listPostCategories()
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: 'Lỗi server' }) }
}

export const createPostCategoryHandler = async (req: Request, res: Response) => {
  try {
    const { name, slug, color } = req.body
    if (!name || !slug) { res.status(400).json({ success: false, message: 'name và slug là bắt buộc' }); return }
    const data = await createPostCategory({ name, slug, color })
    res.status(201).json({ success: true, data })
  } catch (e: any) {
    if (e?.code === 'P2002') { res.status(400).json({ success: false, message: 'Slug đã tồn tại' }); return }
    res.status(500).json({ success: false, message: 'Lỗi server' })
  }
}

export const updatePostCategoryHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string)
    const { name, slug, color } = req.body
    const data = await updatePostCategory(id, { name, slug, color })
    res.json({ success: true, data })
  } catch (e) { res.status(500).json({ success: false, message: 'Lỗi server' }) }
}

export const deletePostCategoryHandler = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string)
    await deletePostCategory(id)
    res.json({ success: true, message: 'Đã xoá' })
  } catch (e) { res.status(500).json({ success: false, message: 'Lỗi server' }) }
}
