import prisma from '../config/db'

export const getWishlist = (user_id: number) =>
  prisma.wishlists.findMany({
    where: { user_id },
    include: {
      products: {
        select: {
          product_id: true,
          name: true,
          slug: true,
          product_images: { where: { is_main: true }, select: { image_url: true }, take: 1 },
        },
      },
      product_variants: { select: { variant_id: true, sku: true, price: true, image_url: true } },
    },
    orderBy: { created_at: 'desc' },
  })

export const getWishlistItem = (user_id: number, product_id: number) =>
  prisma.wishlists.findFirst({ where: { user_id, product_id } })

export const addToWishlist = (user_id: number, product_id: number, variant_id?: number) =>
  prisma.wishlists.create({ data: { user_id, product_id, variant_id } })

export const removeFromWishlist = (wishlist_id: number) =>
  prisma.wishlists.delete({ where: { wishlist_id } })

export const getWishlistById = (wishlist_id: number) =>
  prisma.wishlists.findUnique({ where: { wishlist_id } })
