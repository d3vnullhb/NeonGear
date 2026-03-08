import prisma from '../config/db'

const generateOrderCode = () => `NG${Date.now().toString(36).toUpperCase()}`

export const createOrder = (data: {
  user_id: number
  total_amount: number
  discount_amount?: number
  shipping_fee?: number
  final_amount: number
  coupon_id?: number
  shipping_address: string
  shipping_method?: string
  payment_method?: string
  note?: string
  status_id: number
  items: { variant_id: number; quantity: number; price: number; product_name: string; variant_info?: string; sku: string }[]
}) => {
  const { items, ...orderData } = data
  return prisma.orders.create({
    data: {
      ...orderData,
      order_code: generateOrderCode(),
      order_details: { create: items },
      order_status_history: { create: [{ status_id: data.status_id, note: 'Đơn hàng được tạo' }] },
    },
    include: { order_details: true, order_status: true },
  })
}

export const getOrderById = (order_id: number) =>
  prisma.orders.findUnique({
    where: { order_id },
    include: {
      order_details: true,
      order_status: true,
      order_status_history: { include: { order_status: true }, orderBy: { changed_at: 'desc' } },
      users: { select: { user_id: true, full_name: true, email: true, phone: true } },
    },
  })

export const listUserOrders = (user_id: number, page: number, limit: number) => {
  const where = { user_id }
  return Promise.all([
    prisma.orders.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        order_status: true,
        order_details: { select: { product_name: true, quantity: true, price: true } },
      },
    }),
    prisma.orders.count({ where }),
  ])
}

export const listAllOrders = (params: { page: number; limit: number; status_id?: number; search?: string }) => {
  const { page, limit, status_id, search } = params
  const where: any = {}
  if (status_id) where.status_id = status_id
  if (search) where.OR = [
    { order_code: { contains: search, mode: 'insensitive' } },
    { users: { email: { contains: search, mode: 'insensitive' } } },
  ]
  return Promise.all([
    prisma.orders.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        order_status: true,
        users: { select: { user_id: true, full_name: true, email: true } },
        order_details: { select: { product_name: true, quantity: true } },
      },
    }),
    prisma.orders.count({ where }),
  ])
}

export const updateOrderStatus = (order_id: number, status_id: number, note?: string) =>
  prisma.$transaction([
    prisma.orders.update({ where: { order_id }, data: { status_id } }),
    prisma.order_status_history.create({ data: { order_id, status_id, note } }),
  ])

export const getOrderStatus = (name: string) =>
  prisma.order_status.findUnique({ where: { name } })

export const listOrderStatuses = () => prisma.order_status.findMany()
