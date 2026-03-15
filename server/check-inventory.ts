import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Show all inventory
  const inv = await prisma.inventory.findMany({
    include: {
      product_variants: {
        select: { sku: true, is_default: true, products: { select: { name: true } } }
      }
    },
    orderBy: { variant_id: 'asc' }
  })
  console.log('\n=== INVENTORY ===')
  for (const i of inv) {
    console.log(`variant_id=${i.variant_id} qty=${i.quantity} | ${i.product_variants?.products?.name} (${i.product_variants?.sku}) default=${i.product_variants?.is_default}`)
  }

  // Show non-cancelled orders and their details
  const orders = await prisma.orders.findMany({
    where: { order_status: { name: { not: 'cancelled' } } },
    include: {
      order_details: true,
      order_status: true,
    },
    orderBy: { created_at: 'desc' }
  })
  console.log('\n=== ACTIVE ORDERS ===')
  for (const o of orders) {
    console.log(`\nOrder ${o.order_code} [${o.order_status?.name}]`)
    for (const d of o.order_details) {
      // Check if inventory was deducted (export transaction exists)
      const exported = await prisma.inventory_transactions.findFirst({
        where: { variant_id: d.variant_id!, reference_id: o.order_id, change_quantity: { lt: 0 } }
      })
      console.log(`  variant_id=${d.variant_id} qty=${d.quantity} | inventory_deducted=${!!exported}`)
    }
  }
}

main().catch(console.error).finally(() => pool.end())
