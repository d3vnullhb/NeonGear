import prisma from '../config/db'

export const getOrCreateCart = async (user_id: number) => {
  let cart = await prisma.carts.findUnique({ where: { user_id } })
  if (!cart) cart = await prisma.carts.create({ data: { user_id } })
  return cart
}

export const getCartWithItems = (user_id: number) =>
  prisma.carts.findUnique({
    where: { user_id },
    include: {
      cart_items: {
        where: {
          product_variants: {
            deleted_at: null,
            products: { deleted_at: null },
          },
        },
        include: {
          product_variants: {
            select: {
              variant_id: true,
              sku: true,
              price: true,
              compare_price: true,
              image_url: true,
              is_active: true,
              deleted_at: true,
              inventory: { select: { quantity: true } },
              products: { select: { product_id: true, name: true, slug: true } },
              product_attribute_values: {
                select: { value: true, attributes: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })

export const getCartItem = (id: number) =>
  prisma.cart_items.findUnique({ where: { id } })

export const getCartItemByVariant = (cart_id: number, variant_id: number) =>
  prisma.cart_items.findUnique({ where: { cart_id_variant_id: { cart_id, variant_id } } })

export const addCartItem = (cart_id: number, variant_id: number, quantity: number) =>
  prisma.cart_items.create({ data: { cart_id, variant_id, quantity } })

export const updateCartItem = (id: number, quantity: number) =>
  prisma.cart_items.update({ where: { id }, data: { quantity } })

export const removeCartItem = (id: number) =>
  prisma.cart_items.delete({ where: { id } })

export const clearCart = (cart_id: number) =>
  prisma.cart_items.deleteMany({ where: { cart_id } })
