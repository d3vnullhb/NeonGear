import prisma from '../config/db'

export const listBrands = () =>
  prisma.brands.findMany({ where: { deleted_at: null }, orderBy: { name: 'asc' } })

export const listBrandsPaginated = (page: number, limit: number) => {
  const where = { deleted_at: null }
  return Promise.all([
    prisma.brands.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { created_at: 'desc' } }),
    prisma.brands.count({ where }),
  ])
}

export const getBrandBySlug = (slug: string) =>
  prisma.brands.findFirst({ where: { slug, deleted_at: null } })

export const getBrandById = (brand_id: number) =>
  prisma.brands.findFirst({ where: { brand_id, deleted_at: null } })

export const createBrand = (data: { name: string; slug: string; description?: string; logo_url?: string }) =>
  prisma.brands.create({ data })

export const updateBrand = (
  brand_id: number,
  data: { name?: string; slug?: string; description?: string; logo_url?: string }
) => prisma.brands.update({ where: { brand_id }, data })

export const softDeleteBrand = (brand_id: number) =>
  prisma.brands.update({ where: { brand_id }, data: { deleted_at: new Date() } })
