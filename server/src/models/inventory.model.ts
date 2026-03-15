import prisma from '../config/db'

export const getInventoryByVariant = (variant_id: number) =>
  prisma.inventory.findUnique({ where: { variant_id } })

export const upsertInventory = (variant_id: number, quantity: number) =>
  prisma.inventory.upsert({
    where: { variant_id },
    update: { quantity, updated_at: new Date() },
    create: { variant_id, quantity },
  })

export const adjustInventory = async (variant_id: number, delta: number) => {
  if (delta > 0) {
    // Restore (cancel/return): raw SQL to avoid Prisma nullable-unique upsert issues
    const updated = await prisma.$executeRaw`
      UPDATE inventory SET quantity = quantity + ${delta}, updated_at = NOW()
      WHERE variant_id = ${variant_id}
    `
    if (updated === 0) {
      // Record doesn't exist yet — create it
      await prisma.$executeRaw`
        INSERT INTO inventory (variant_id, quantity, updated_at) VALUES (${variant_id}, ${delta}, NOW())
      `
    }
    return
  }
  // Decrement: atomic check to prevent going below 0
  const result = await prisma.$executeRaw`
    UPDATE inventory
    SET quantity = quantity + ${delta}, updated_at = NOW()
    WHERE variant_id = ${variant_id} AND quantity + ${delta} >= 0
  `
  if (result === 0) throw new Error(`Sản phẩm không đủ tồn kho (variant_id=${variant_id})`)
}

export const addInventoryTransaction = (data: {
  variant_id: number
  change_quantity: number
  transaction_type: string
  reference_id?: number
  note?: string
}) => prisma.inventory_transactions.create({ data })

export const listInventory = (page: number, limit: number) =>
  Promise.all([
    prisma.inventory.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updated_at: 'desc' },
      include: {
        product_variants: {
          select: { sku: true, products: { select: { product_id: true, name: true } } },
        },
      },
    }),
    prisma.inventory.count(),
  ])

export const listInventoryTransactions = (variant_id: number, page: number, limit: number) =>
  prisma.inventory_transactions.findMany({
    where: { variant_id },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { created_at: 'desc' },
  })
