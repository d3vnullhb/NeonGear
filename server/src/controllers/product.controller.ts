import { Request, Response } from 'express'
import {
  listProducts,
  getProductAttributeOptions,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  softDeleteProduct,
  createVariant,
  updateVariant,
  softDeleteVariant,
  getVariantById,
  addProductImage,
  getProductImage,
  deleteProductImage,
  setVariantAttributeValues,
} from '../models/product.model'
import { upsertInventory, addInventoryTransaction } from '../models/inventory.model'
import { streamToCloudinary } from '../middlewares/upload.middleware'

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : undefined
    const brand_id = req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined
    const search = req.query.search as string | undefined
    const sort = req.query.sort as string | undefined
    const in_stock = req.query.in_stock === 'true'
    const min_price = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined
    const max_price = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined
    // Parse attr_X=val1,val2 params
    const attribute_filters: { attribute_id: number; values: string[] }[] = []
    for (const [key, val] of Object.entries(req.query)) {
      if (key.startsWith('attr_')) {
        const attrId = parseInt(key.replace('attr_', ''))
        if (!isNaN(attrId) && typeof val === 'string' && val) {
          const values = val.split(',').slice(0, 20) // tối đa 20 values/attribute
          attribute_filters.push({ attribute_id: attrId, values })
        }
      }
    }
    const [products, total] = await listProducts({
      page, limit, category_id, brand_id, search, is_active: true,
      sort, in_stock: in_stock || undefined, min_price, max_price,
      attribute_filters: attribute_filters.length > 0 ? attribute_filters : undefined,
    })
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy sản phẩm thành công', data: products, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getProductFilterOptions = async (req: Request, res: Response) => {
  try {
    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : undefined
    const data = await getProductAttributeOptions(category_id)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const getProductBySlugHandler = async (req: Request, res: Response) => {
  try {
    const product = await getProductBySlug(req.params.slug as string)
    if (!product) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
      return
    }
    res.json({ success: true, message: 'Lấy sản phẩm thành công', data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Admin
export const adminListProducts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const category_id = req.query.category_id ? parseInt(req.query.category_id as string) : undefined
    const brand_id = req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined
    const search = req.query.search as string | undefined
    const [products, total] = await listProducts({ page, limit, category_id, brand_id, search })
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy sản phẩm thành công', data: products, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminGetProduct = async (req: Request, res: Response) => {
  try {
    const product = await getProductById(parseInt(req.params.id as string))
    if (!product) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
      return
    }
    res.json({ success: true, message: 'Lấy sản phẩm thành công', data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminCreateProduct = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, category_id, brand_id, is_active } = req.body
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'name và slug là bắt buộc' })
      return
    }
    const product = await createProduct({
      name,
      slug,
      description,
      category_id: category_id ? parseInt(category_id) : undefined,
      brand_id: brand_id ? parseInt(brand_id) : undefined,
      is_active: is_active !== undefined ? is_active === 'true' || is_active === true : true,
    })
    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateProduct = async (req: Request, res: Response) => {
  try {
    const product_id = parseInt(req.params.id as string)
    const existing = await getProductById(product_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
      return
    }
    const { name, slug, description, category_id, brand_id, is_active } = req.body
    const data: any = {}
    if (name) data.name = name
    if (slug) data.slug = slug
    if (description !== undefined) data.description = description
    if (category_id !== undefined) data.category_id = parseInt(category_id)
    if (brand_id !== undefined) data.brand_id = parseInt(brand_id)
    if (is_active !== undefined) data.is_active = is_active === 'true' || is_active === true
    const product = await updateProduct(product_id, data)
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công', data: product })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteProduct = async (req: Request, res: Response) => {
  try {
    const product_id = parseInt(req.params.id as string)
    const existing = await getProductById(product_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' })
      return
    }
    await softDeleteProduct(product_id)
    res.json({ success: true, message: 'Xoá sản phẩm thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Variant handlers
export const adminCreateVariant = async (req: Request, res: Response) => {
  try {
    const product_id = parseInt(req.params.id as string)
    const { sku, price, compare_price, is_active, is_default, initial_stock, attributes } = req.body
    if (!sku || !price) {
      res.status(400).json({ success: false, message: 'sku và price là bắt buộc' })
      return
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      res.status(400).json({ success: false, message: 'Giá phải là số dương' })
      return
    }
    const parsedCompare = compare_price ? parseFloat(compare_price) : undefined
    if (parsedCompare !== undefined && parsedCompare <= 0) {
      res.status(400).json({ success: false, message: 'Giá gốc phải là số dương' })
      return
    }
    const image_url = (req as any).cloudinaryUrl
    const variant = await createVariant({ product_id, sku, price: parsedPrice, compare_price: parsedCompare, image_url, is_active, is_default })
    const stock = initial_stock ? parseInt(initial_stock) : 0
    await upsertInventory(variant.variant_id, stock)
    if (stock > 0) await addInventoryTransaction({ variant_id: variant.variant_id, change_quantity: stock, transaction_type: 'import', note: 'Nhập kho ban đầu' })
    if (attributes && Array.isArray(attributes)) await setVariantAttributeValues(variant.variant_id, attributes)
    res.status(201).json({ success: true, message: 'Tạo variant thành công', data: variant })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminUpdateVariant = async (req: Request, res: Response) => {
  try {
    const variant_id = parseInt(req.params.variantId as string)
    const existing = await getVariantById(variant_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy variant' })
      return
    }
    const { sku, price, compare_price, is_active, is_default, attributes } = req.body
    const data: any = {}
    if (sku) data.sku = sku
    if (price !== undefined) {
      const p = parseFloat(price)
      if (isNaN(p) || p <= 0) { res.status(400).json({ success: false, message: 'Giá phải là số dương' }); return }
      data.price = p
    }
    if (compare_price !== undefined) {
      const cp = parseFloat(compare_price)
      if (isNaN(cp) || cp <= 0) { res.status(400).json({ success: false, message: 'Giá gốc phải là số dương' }); return }
      data.compare_price = cp
    }
    if (is_active !== undefined) data.is_active = is_active === 'true' || is_active === true
    if (is_default !== undefined) data.is_default = is_default === 'true' || is_default === true
    if ((req as any).cloudinaryUrl) data.image_url = (req as any).cloudinaryUrl
    const variant = await updateVariant(variant_id, data)
    if (attributes && Array.isArray(attributes)) await setVariantAttributeValues(variant_id, attributes)
    res.json({ success: true, message: 'Cập nhật variant thành công', data: variant })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteVariant = async (req: Request, res: Response) => {
  try {
    const variant_id = parseInt(req.params.variantId as string)
    const existing = await getVariantById(variant_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy variant' })
      return
    }
    await softDeleteVariant(variant_id)
    res.json({ success: true, message: 'Xoá variant thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

// Image handlers
export const adminUploadProductImages = async (req: Request, res: Response) => {
  try {
    const product_id = parseInt(req.params.id as string)
    const files = req.files as Express.Multer.File[]
    if (!files || !files.length) {
      res.status(400).json({ success: false, message: 'Không có ảnh được upload' })
      return
    }
    const { variant_id, is_main } = req.body
    const images = await Promise.all(
      files.map(async (file, i) => {
        const image_url = await streamToCloudinary(file.buffer, 'neongear/products')
        return addProductImage({
          product_id,
          variant_id: variant_id ? parseInt(variant_id) : undefined,
          image_url,
          is_main: i === 0 && (is_main === 'true' || is_main === true),
          sort_order: i,
        })
      })
    )
    res.status(201).json({ success: true, message: 'Upload ảnh thành công', data: images })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminDeleteProductImage = async (req: Request, res: Response) => {
  try {
    const image_id = parseInt(req.params.imageId as string)
    const existing = await getProductImage(image_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' })
      return
    }
    await deleteProductImage(image_id)
    res.json({ success: true, message: 'Xoá ảnh thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
