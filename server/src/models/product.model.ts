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
  sort?: string
  in_stock?: boolean
  min_price?: number
  max_price?: number
  attribute_filters?: { attribute_id: number; values: string[] }[]
}) => {
  const { page, limit, category_id, brand_id, search, is_active, sort, in_stock, min_price, max_price, attribute_filters } = params
  const where: any = { deleted_at: null }
  if (category_id) where.category_id = category_id
  if (brand_id) where.brand_id = brand_id
  if (search) where.name = { contains: search, mode: 'insensitive' }
  if (is_active !== undefined) where.is_active = is_active

  // Variant-level filters (in_stock, price range, attributes)
  const variantConditions: any[] = []
  if (in_stock) variantConditions.push({ inventory: { quantity: { gt: 0 } } })
  if (min_price !== undefined || max_price !== undefined) {
    const priceFilter: any = {}
    if (min_price !== undefined) priceFilter.gte = min_price
    if (max_price !== undefined) priceFilter.lte = max_price
    variantConditions.push({ price: priceFilter })
  }
  if (attribute_filters && attribute_filters.length > 0) {
    for (const f of attribute_filters) {
      variantConditions.push({ product_attribute_values: { some: { attribute_id: f.attribute_id, value: { in: f.values } } } })
    }
  }
  if (variantConditions.length > 0) {
    where.product_variants = variantConditions.length === 1 ? variantConditions[0] : { AND: variantConditions }
  }

  // Sort
  let orderBy: any = { created_at: 'desc' }
  switch (sort) {
    case 'oldest': orderBy = { created_at: 'asc' }; break
    case 'price_asc': orderBy = { product_variants: { price: 'asc' } }; break
    case 'price_desc': orderBy = { product_variants: { price: 'desc' } }; break
    case 'name_asc': orderBy = { name: 'asc' }; break
    case 'name_desc': orderBy = { name: 'desc' }; break
    default: orderBy = { created_at: 'desc' }
  }

  return Promise.all([
    prisma.products.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: {
        ...productSelect,
        product_variants: { select: variantSelect },
      },
    }),
    prisma.products.count({ where }),
  ])
}

export const getProductAttributeOptions = async (category_id?: number) => {
  const productWhere: any = { deleted_at: null, is_active: true }
  if (category_id) productWhere.category_id = category_id
  const rows = await prisma.product_attribute_values.findMany({
    where: { product_variants: { deleted_at: null, products: productWhere } },
    select: { attribute_id: true, value: true, attributes: { select: { attribute_id: true, name: true } } },
    distinct: ['attribute_id', 'value'],
    orderBy: [{ attribute_id: 'asc' }],
  })
  const map = new Map<number, { attribute_id: number; name: string; values: string[] }>()
  for (const row of rows) {
    if (!row.attributes || row.attribute_id == null) continue
    if (!map.has(row.attribute_id)) map.set(row.attribute_id, { attribute_id: row.attribute_id, name: row.attributes.name, values: [] })
    map.get(row.attribute_id)!.values.push(row.value)
  }
  return Array.from(map.values())
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
