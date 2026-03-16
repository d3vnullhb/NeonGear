import { Request, Response } from 'express'
import {
  listBrands,
  listBrandsPaginated,
  getBrandBySlug,
  getBrandById,
  createBrand,
  updateBrand,
  softDeleteBrand,
} from '../models/brand.model'

export const getBrands = async (_req: Request, res: Response) => {
  try {
    const brands = await listBrands()
    res.json({ success: true, message: 'Lấy thương hiệu thành công', data: brands })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getBrandBySlugHandler = async (req: Request, res: Response) => {
  try {
    const brand = await getBrandBySlug(req.params.slug as string)
    if (!brand) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' })
      return
    }
    res.json({ success: true, message: 'Lấy thương hiệu thành công', data: brand })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListBrands = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [brands, total] = await listBrandsPaginated(page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy thương hiệu thành công', data: brands, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminCreateBrand = async (req: Request, res: Response) => {
  try {
    const { name, slug, description } = req.body
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'name và slug là bắt buộc' })
      return
    }
    const logo_url = (req as any).cloudinaryUrl
    const brand = await createBrand({ name, slug, description, logo_url })
    res.status(201).json({ success: true, message: 'Tạo thương hiệu thành công', data: brand })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateBrand = async (req: Request, res: Response) => {
  try {
    const brand_id = parseInt(req.params.id as string)
    const existing = await getBrandById(brand_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' })
      return
    }
    const data: any = { ...req.body }
    if ((req as any).cloudinaryUrl) data.logo_url = (req as any).cloudinaryUrl
    const brand = await updateBrand(brand_id, data)
    res.json({ success: true, message: 'Cập nhật thương hiệu thành công', data: brand })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteBrand = async (req: Request, res: Response) => {
  try {
    const brand_id = parseInt(req.params.id as string)
    const existing = await getBrandById(brand_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' })
      return
    }
    await softDeleteBrand(brand_id)
    res.json({ success: true, message: 'Xoá thương hiệu thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
