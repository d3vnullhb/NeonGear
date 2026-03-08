import prisma from '../config/db'

export const listCategories = () =>
  prisma.categories.findMany({
    where: { deleted_at: null },
    orderBy: { name: 'asc' },
    include: {
      other_categories: {
        where: { deleted_at: null },
        select: { category_id: true, name: true, slug: true },
      },
    },
  })

export const listCategoriesPaginated = (page: number, limit: number) => {
  const where = { deleted_at: null }
  return Promise.all([
    prisma.categories.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { created_at: 'desc' } }),
    prisma.categories.count({ where }),
  ])
}

export const getCategoryBySlug = (slug: string) =>
  prisma.categories.findFirst({ where: { slug, deleted_at: null } })

export const getCategoryById = (category_id: number) =>
  prisma.categories.findFirst({ where: { category_id, deleted_at: null } })

export const createCategory = (data: {
  name: string
  slug: string
  parent_id?: number
  image_url?: string
  is_visible?: boolean
}) => prisma.categories.create({ data })

export const updateCategory = (
  category_id: number,
  data: { name?: string; slug?: string; parent_id?: number; image_url?: string; is_visible?: boolean }
) => prisma.categories.update({ where: { category_id }, data })

export const softDeleteCategory = (category_id: number) =>
  prisma.categories.update({ where: { category_id }, data: { deleted_at: new Date() } })
