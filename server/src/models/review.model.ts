import prisma from '../config/db'

export const listProductReviews = (product_id: number, page: number, limit: number) => {
  const where = { product_id, deleted_at: null, is_approved: true }
  return Promise.all([
    prisma.reviews.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { user_id: true, full_name: true, avatar_url: true } },
        review_images: { select: { image_id: true, image_url: true, alt_text: true } },
      },
    }),
    prisma.reviews.count({ where }),
  ])
}

export const listAllReviews = (page: number, limit: number, is_approved?: boolean) => {
  const where: any = { deleted_at: null }
  if (is_approved !== undefined) where.is_approved = is_approved
  return Promise.all([
    prisma.reviews.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: { select: { user_id: true, full_name: true, email: true } },
        products: { select: { product_id: true, name: true } },
        review_images: { select: { image_id: true, image_url: true } },
      },
    }),
    prisma.reviews.count({ where }),
  ])
}

export const getReviewById = (review_id: number) =>
  prisma.reviews.findFirst({ where: { review_id, deleted_at: null } })

export const getUserProductReview = (user_id: number, product_id: number) =>
  prisma.reviews.findFirst({ where: { user_id, product_id, deleted_at: null } })

export const createReview = (data: {
  product_id: number
  user_id: number
  order_id?: number
  rating: number
  comment?: string
}) => prisma.reviews.create({ data })

export const updateReview = (review_id: number, data: { rating?: number; comment?: string }) =>
  prisma.reviews.update({ where: { review_id }, data })

export const softDeleteReview = (review_id: number) =>
  prisma.reviews.update({ where: { review_id }, data: { deleted_at: new Date() } })

export const approveReview = (review_id: number) =>
  prisma.reviews.update({ where: { review_id }, data: { is_approved: true } })

export const addReviewImages = (review_id: number, images: { image_url: string; alt_text?: string }[]) =>
  prisma.review_images.createMany({
    data: images.map((img, i) => ({ ...img, review_id, sort_order: i })),
  })

export const getUserReviewsByProductIds = (user_id: number, product_ids: number[]) =>
  prisma.reviews.findMany({
    where: { user_id, product_id: { in: product_ids }, deleted_at: null },
    select: { review_id: true, product_id: true, rating: true, comment: true },
  })
