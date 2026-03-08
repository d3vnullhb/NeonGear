import prisma from '../config/db'

export const getUserById = (user_id: number) =>
  prisma.users.findFirst({
    where: { user_id, deleted_at: null },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      phone: true,
      address: true,
      avatar_url: true,
      date_of_birth: true,
      is_verified: true,
      role: true,
      last_login: true,
      created_at: true,
    },
  })

export const updateUser = (
  user_id: number,
  data: { full_name?: string; phone?: string; address?: string; avatar_url?: string; date_of_birth?: Date }
) =>
  prisma.users.update({
    where: { user_id },
    data,
    select: {
      user_id: true,
      full_name: true,
      email: true,
      phone: true,
      address: true,
      avatar_url: true,
      date_of_birth: true,
      role: true,
    },
  })

export const listUsers = (page: number, limit: number, search?: string) => {
  const where: any = {
    deleted_at: null,
    ...(search
      ? { OR: [{ full_name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {}),
  }
  return Promise.all([
    prisma.users.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: { user_id: true, full_name: true, email: true, phone: true, role: true, is_verified: true, last_login: true, created_at: true },
    }),
    prisma.users.count({ where }),
  ])
}

export const softDeleteUser = (user_id: number) =>
  prisma.users.update({ where: { user_id }, data: { deleted_at: new Date() } })

export const updateUserRole = (user_id: number, role: string) =>
  prisma.users.update({ where: { user_id }, data: { role } })
