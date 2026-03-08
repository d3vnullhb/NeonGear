import prisma from '../config/db'

export const createContact = (data: {
  user_id?: number
  full_name: string
  email: string
  phone?: string
  subject: string
  message: string
}) => prisma.contacts.create({ data })

export const listContacts = (page: number, limit: number, status?: string) => {
  const where: any = {}
  if (status) where.status = status
  return Promise.all([
    prisma.contacts.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: { users_contacts_user_idTousers: { select: { user_id: true, full_name: true, email: true } } },
    }),
    prisma.contacts.count({ where }),
  ])
}

export const getContactById = (contact_id: number) =>
  prisma.contacts.findUnique({ where: { contact_id } })

export const replyContact = (contact_id: number, replied_by: number, reply: string) =>
  prisma.contacts.update({
    where: { contact_id },
    data: { replied_by, reply, replied_at: new Date(), status: 'replied' },
  })
