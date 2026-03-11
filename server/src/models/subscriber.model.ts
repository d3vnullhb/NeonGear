import prisma from '../config/db'

export const subscribeEmail = (email: string) =>
  prisma.email_subscribers.upsert({
    where: { email },
    update: { is_active: true, unsubscribed_at: null },
    create: { email },
  })

export const unsubscribeEmail = (email: string) =>
  prisma.email_subscribers.update({
    where: { email },
    data: { is_active: false, unsubscribed_at: new Date() },
  })

export const listSubscribers = (params: { page: number; limit: number; active?: boolean; search?: string }) => {
  const { page, limit, active, search } = params
  const where: any = {}
  if (active !== undefined) where.is_active = active
  if (search) where.email = { contains: search, mode: 'insensitive' }
  return Promise.all([
    prisma.email_subscribers.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { subscribed_at: 'desc' },
    }),
    prisma.email_subscribers.count({ where }),
  ])
}

export const deleteSubscriber = (subscriber_id: number) =>
  prisma.email_subscribers.delete({ where: { subscriber_id } })

export const toggleSubscriberStatus = async (subscriber_id: number) => {
  const sub = await prisma.email_subscribers.findUnique({ where: { subscriber_id } })
  if (!sub) return null
  return prisma.email_subscribers.update({
    where: { subscriber_id },
    data: {
      is_active: !sub.is_active,
      unsubscribed_at: sub.is_active ? new Date() : null,
    },
  })
}

export const getSubscriberStats = () =>
  Promise.all([
    prisma.email_subscribers.count(),
    prisma.email_subscribers.count({ where: { is_active: true } }),
  ]).then(([total, active]) => ({ total, active, inactive: total - active }))
