import prisma from '../config/db'

export const listPublishedPosts = (page: number, limit: number, category?: string) => {
  const where: any = { deleted_at: null, is_published: true }
  if (category) where.category = category
  return Promise.all([
    prisma.posts.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { published_at: 'desc' },
      select: {
        post_id: true,
        title: true,
        slug: true,
        thumbnail: true,
        excerpt: true,
        category: true,
        published_at: true,
        created_at: true,
        users: { select: { user_id: true, full_name: true } },
      },
    }),
    prisma.posts.count({ where }),
  ])
}

export const getPostBySlug = (slug: string) =>
  prisma.posts.findFirst({
    where: { slug, deleted_at: null, is_published: true },
    include: { users: { select: { user_id: true, full_name: true, avatar_url: true } } },
  })

export const getPostById = (post_id: number) =>
  prisma.posts.findFirst({ where: { post_id, deleted_at: null } })

export const listAllPosts = (page: number, limit: number) => {
  const where = { deleted_at: null }
  return Promise.all([
    prisma.posts.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        post_id: true,
        title: true,
        slug: true,
        thumbnail: true,
        category: true,
        is_published: true,
        created_at: true,
        users: { select: { full_name: true } },
      },
    }),
    prisma.posts.count({ where }),
  ])
}

export const createPost = (data: {
  user_id: number
  title: string
  slug: string
  content: string
  thumbnail?: string
  excerpt?: string
  category?: string
  is_published?: boolean
  published_at?: Date
}) => prisma.posts.create({ data })

export const updatePost = (post_id: number, data: Record<string, any>) =>
  prisma.posts.update({ where: { post_id }, data: { ...data, updated_at: new Date() } })

export const softDeletePost = (post_id: number) =>
  prisma.posts.update({ where: { post_id }, data: { deleted_at: new Date() } })
