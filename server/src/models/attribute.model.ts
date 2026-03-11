import prisma from '../config/db'

export const listAttributes = () => prisma.attributes.findMany({ orderBy: { name: 'asc' } })

export const getAttributeById = (attribute_id: number) =>
  prisma.attributes.findUnique({ where: { attribute_id } })

export const createAttribute = (data: { name: string; data_type?: string }) =>
  prisma.attributes.create({ data })

export const updateAttribute = (attribute_id: number, data: { name?: string; data_type?: string }) =>
  prisma.attributes.update({ where: { attribute_id }, data })

export const deleteAttribute = (attribute_id: number) =>
  prisma.attributes.delete({ where: { attribute_id } })
