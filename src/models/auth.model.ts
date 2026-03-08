import prisma from '../config/db'

export const findUserByEmail = (email: string) =>
  prisma.users.findFirst({
    where: { email, deleted_at: null },
  })

export const findUserById = (user_id: number) =>
  prisma.users.findFirst({
    where: { user_id, deleted_at: null },
  })

export const createUser = (data: {
  full_name: string
  email: string
  password_hash: string
  phone?: string
}) =>
  prisma.users.create({
    data,
    select: {
      user_id: true,
      full_name: true,
      email: true,
      phone: true,
      role: true,
      created_at: true,
    },
  })

export const updateLastLogin = (user_id: number) =>
  prisma.users.update({
    where: { user_id },
    data: { last_login: new Date() },
  })

export const updatePassword = (user_id: number, password_hash: string) =>
  prisma.users.update({
    where: { user_id },
    data: { password_hash },
  })

export const findOrCreateSocialUser = async (data: {
  full_name: string
  email: string
  avatar_url?: string
}) => {
  const existing = await prisma.users.findFirst({
    where: { email: data.email, deleted_at: null },
  })
  if (existing) return existing
  return prisma.users.create({
    data: {
      full_name: data.full_name,
      email: data.email,
      password_hash: '',
      avatar_url: data.avatar_url,
    },
  })
}
