import prisma from '../config/db'

export const listPostCategories = () =>
  prisma.post_categories.findMany({ orderBy: { id: 'asc' } })

export const createPostCategory = (data: { name: string; slug: string; color?: string }) =>
  prisma.post_categories.create({ data })

export const updatePostCategory = (id: number, data: { name?: string; slug?: string; color?: string }) =>
  prisma.post_categories.update({ where: { id }, data })

export const deletePostCategory = (id: number) =>
  prisma.post_categories.delete({ where: { id } })
