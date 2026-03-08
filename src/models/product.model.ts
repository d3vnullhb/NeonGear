import prisma from '../config/db'

const variantSelect = {
  variant_id: true,
  sku: true,
  price: true,
  compare_price: true,
  image_url: true,
  is_active: true,
  is_default: true,
  created_at: true,
  inventory: { select: { quantity: true } },
  product_attribute_values: {
    select: { value: true, attributes: { select: { attribute_id: true, name: true } } },
  },
  product_images: {
    orderBy: { sort_order: 'asc' as const },
    select: { image_id: true, image_url: true, alt_text: true, is_main: true, sort_order: true },
  },
}

const productSelect = {
  product_id: true,
  name: true,
  slug: true,
  description: true,
  is_active: true,
  created_at: true,
  categories: { select: { category_id: true, name: true, slug: true } },
  brands: { select: { brand_id: true, name: true, slug: true } },
  product_images: {
    where: { variant_id: null },
    orderBy: { sort_order: 'asc' as const },
    select: { image_id: true, image_url: true, alt_text: true, is_main: true, sort_order: true },
  },
}

export const listProducts = (params: {
  page: number
  limit: number
  category_id?: number
  brand_id?: number
  search?: string
  is_active?: boolean
}) => {
  const { page, limit, category_id, brand_id, search, is_active } = params
  const where: any = { deleted_at: null }
  if (category_id) where.category_id = category_id
  if (brand_id) where.brand_id = brand_id
  if (search) where.name = { contains: search, mode: 'insensitive' }
  if (is_active !== undefined) where.is_active = is_active
  return Promise.all([
    prisma.products.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        ...productSelect,
        // 1-to-1: default variant per product (partial unique index)
        product_variants: { select: variantSelect },
      },
    }),
    prisma.products.count({ where }),
  ])
}

export const getProductBySlug = async (slug: string) => {
  const product = await prisma.products.findFirst({
    where: { slug, deleted_at: null },
    select: { ...productSelect, product_id: true, product_variants: { select: variantSelect } },
  })
  if (!product) return null
  const allVariants = await prisma.product_variants.findMany({
    where: { product_id: product.product_id, deleted_at: null },
    select: variantSelect,
    orderBy: [{ is_default: 'desc' }, { variant_id: 'asc' }],
  })
  return { ...product, product_variants: allVariants }
}

export const getProductById = async (product_id: number) => {
  const product = await prisma.products.findFirst({
    where: { product_id, deleted_at: null },
    select: { ...productSelect, product_id: true, product_variants: { select: variantSelect } },
  })
  if (!product) return null
  const allVariants = await prisma.product_variants.findMany({
    where: { product_id, deleted_at: null },
    select: variantSelect,
    orderBy: [{ is_default: 'desc' }, { variant_id: 'asc' }],
  })
  return { ...product, product_variants: allVariants }
}

export const createProduct = (data: {
  name: string
  slug: string
  description?: string
  category_id?: number
  brand_id?: number
  is_active?: boolean
}) => prisma.products.create({ data })

export const updateProduct = (
  product_id: number,
  data: { name?: string; slug?: string; description?: string; category_id?: number; brand_id?: number; is_active?: boolean }
) => prisma.products.update({ where: { product_id }, data })

export const softDeleteProduct = (product_id: number) =>
  prisma.products.update({ where: { product_id }, data: { deleted_at: new Date() } })

// Variants
export const getVariantById = (variant_id: number) =>
  prisma.product_variants.findFirst({ where: { variant_id, deleted_at: null } })

export const createVariant = (data: {
  product_id: number
  sku: string
  price: number
  compare_price?: number
  image_url?: string
  is_active?: boolean
  is_default?: boolean
}) => prisma.product_variants.create({ data })

export const updateVariant = (
  variant_id: number,
  data: { sku?: string; price?: number; compare_price?: number; image_url?: string; is_active?: boolean; is_default?: boolean }
) => prisma.product_variants.update({ where: { variant_id }, data })

export const softDeleteVariant = (variant_id: number) =>
  prisma.product_variants.update({ where: { variant_id }, data: { deleted_at: new Date() } })

// Images
export const addProductImage = (data: {
  product_id?: number
  variant_id?: number
  image_url: string
  alt_text?: string
  is_main?: boolean
  sort_order?: number
}) => prisma.product_images.create({ data })

export const getProductImage = (image_id: number) =>
  prisma.product_images.findUnique({ where: { image_id } })

export const deleteProductImage = (image_id: number) =>
  prisma.product_images.delete({ where: { image_id } })

// Attribute values
export const setVariantAttributeValues = async (variant_id: number, values: { attribute_id: number; value: string }[]) => {
  await prisma.product_attribute_values.deleteMany({ where: { variant_id } })
  return prisma.product_attribute_values.createMany({ data: values.map((v) => ({ variant_id, ...v })) })
}
