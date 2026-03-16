import prisma from '../config/db'
import { randomBytes } from 'crypto'

const generateOrderCode = () => `NG${randomBytes(5).toString('hex').toUpperCase()}`

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
      order_details: {
        include: {
          product_variants: {
            select: {
              product_id: true,
              products: { select: { product_id: true, slug: true, product_images: { take: 1, select: { image_url: true } } } },
            },
          },
        },
      },
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

export const deleteOrder = (order_id: number) =>
  prisma.$transaction([
    prisma.coupon_usages.deleteMany({ where: { order_id } }),
    prisma.orders.delete({ where: { order_id } }),
  ])

export const getOrderStatus = (name: string) =>
  prisma.order_status.findUnique({ where: { name } })

export const listOrderStatuses = () => prisma.order_status.findMany()

export const getRevenueStats = async (params?: {
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  startDate?: Date
  endDate?: Date
}) => {
  const delivered = await prisma.order_status.findUnique({ where: { name: 'delivered' } })
  const sid = delivered?.status_id

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const groupBy = params?.groupBy ?? 'month'
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const start = params?.startDate ?? sixMonthsAgo
  const end = params?.endDate ?? now

  const [total, thisMonth, thisWeek, today, rangeSummary] = await Promise.all([
    prisma.orders.aggregate({ where: { status_id: sid }, _sum: { final_amount: true }, _count: true }),
    prisma.orders.aggregate({ where: { status_id: sid, created_at: { gte: startOfMonth } }, _sum: { final_amount: true }, _count: true }),
    prisma.orders.aggregate({ where: { status_id: sid, created_at: { gte: startOfWeek } }, _sum: { final_amount: true }, _count: true }),
    prisma.orders.aggregate({ where: { status_id: sid, created_at: { gte: startOfDay } }, _sum: { final_amount: true }, _count: true }),
    prisma.orders.aggregate({ where: { status_id: sid, created_at: { gte: start, lte: end } }, _sum: { final_amount: true }, _count: true, _avg: { final_amount: true } }),
  ])

  let chart: { period: string; revenue: number; orders: number }[] = []
  if (groupBy === 'day') {
    chart = await prisma.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as period,
             SUM(final_amount)::float as revenue, COUNT(*)::int as orders
      FROM orders WHERE status_id = ${sid} AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE_TRUNC('day', created_at) ORDER BY DATE_TRUNC('day', created_at)
    `
  } else if (groupBy === 'week') {
    chart = await prisma.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('week', created_at), 'IYYY"-W"IW') as period,
             SUM(final_amount)::float as revenue, COUNT(*)::int as orders
      FROM orders WHERE status_id = ${sid} AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE_TRUNC('week', created_at) ORDER BY DATE_TRUNC('week', created_at)
    `
  } else if (groupBy === 'quarter') {
    chart = await prisma.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY') || '-Q' || EXTRACT(QUARTER FROM created_at)::text as period,
             SUM(final_amount)::float as revenue, COUNT(*)::int as orders
      FROM orders WHERE status_id = ${sid} AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE_TRUNC('quarter', created_at) ORDER BY DATE_TRUNC('quarter', created_at)
    `
  } else if (groupBy === 'year') {
    chart = await prisma.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('year', created_at), 'YYYY') as period,
             SUM(final_amount)::float as revenue, COUNT(*)::int as orders
      FROM orders WHERE status_id = ${sid} AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE_TRUNC('year', created_at) ORDER BY DATE_TRUNC('year', created_at)
    `
  } else {
    chart = await prisma.$queryRaw<{ period: string; revenue: number; orders: number }[]>`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as period,
             SUM(final_amount)::float as revenue, COUNT(*)::int as orders
      FROM orders WHERE status_id = ${sid} AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)
    `
  }

  const [byStatus, topProducts] = await Promise.all([
    prisma.$queryRaw<{ name: string; count: number }[]>`
      SELECT os.name, COUNT(o.order_id)::int as count
      FROM order_status os
      LEFT JOIN orders o ON o.status_id = os.status_id
        AND o.created_at >= ${start} AND o.created_at <= ${end}
      GROUP BY os.status_id, os.name ORDER BY os.status_id
    `,
    prisma.$queryRaw<{ product_name: string; total_quantity: number; total_revenue: number }[]>`
      SELECT od.product_name,
             SUM(od.quantity)::int as total_quantity,
             SUM(od.quantity * od.price)::float as total_revenue
      FROM order_details od
      JOIN orders o ON od.order_id = o.order_id
      WHERE o.status_id = ${sid} AND o.created_at >= ${start} AND o.created_at <= ${end}
      GROUP BY od.product_name ORDER BY total_quantity DESC, total_revenue DESC LIMIT 5
    `,
  ])

  return {
    totalRevenue: Number(total._sum.final_amount ?? 0),
    totalOrders: total._count,
    monthRevenue: Number(thisMonth._sum.final_amount ?? 0),
    weekRevenue: Number(thisWeek._sum.final_amount ?? 0),
    todayRevenue: Number(today._sum.final_amount ?? 0),
    rangeRevenue: Number(rangeSummary._sum.final_amount ?? 0),
    rangeOrders: rangeSummary._count,
    rangeAvg: Number(rangeSummary._avg.final_amount ?? 0),
    chart,
    byStatus,
    topProducts,
  }
}
