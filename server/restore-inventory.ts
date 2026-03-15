/**
 * One-time script: restore inventory for all cancelled orders
 * Run: npx tsx restore-inventory.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Find all cancelled orders that have not been restored yet
  // (we check: sum of export transactions > sum of import/cancel_return transactions for each variant in cancelled orders)
  const cancelledOrders = await prisma.orders.findMany({
    where: {
      order_status: { name: 'cancelled' },
    },
    include: {
      order_details: true,
    },
  })

  console.log(`Found ${cancelledOrders.length} cancelled orders`)

  // Build a map of variant_id → total quantity to restore
  const restoreMap: Record<number, number> = {}

  for (const order of cancelledOrders) {
    // Check if there's already an import transaction for this order (already restored)
    for (const detail of order.order_details) {
      if (!detail.variant_id) continue

      const existing = await prisma.inventory_transactions.findFirst({
        where: {
          variant_id: detail.variant_id,
          reference_id: order.order_id,
          change_quantity: { gt: 0 },
        },
      })

      if (!existing) {
        restoreMap[detail.variant_id] = (restoreMap[detail.variant_id] ?? 0) + detail.quantity
        console.log(`  → Order ${order.order_code}: variant ${detail.variant_id} qty +${detail.quantity} (not yet restored)`)
      } else {
        console.log(`  ✓ Order ${order.order_code}: variant ${detail.variant_id} already restored`)
      }
    }
  }

  if (Object.keys(restoreMap).length === 0) {
    console.log('\nAll inventory already restored. Nothing to do.')
    return
  }

  console.log('\nRestoring inventory...')
  for (const [variantIdStr, qty] of Object.entries(restoreMap)) {
    const variant_id = parseInt(variantIdStr)
    const updated = await prisma.$executeRaw`
      UPDATE inventory SET quantity = quantity + ${qty}, updated_at = NOW()
      WHERE variant_id = ${variant_id}
    `
    if (updated === 0) {
      await prisma.$executeRaw`
        INSERT INTO inventory (variant_id, quantity, updated_at)
        VALUES (${variant_id}, ${qty}, NOW())
        ON CONFLICT (variant_id) DO UPDATE SET quantity = inventory.quantity + ${qty}, updated_at = NOW()
      `
    }
    await prisma.inventory_transactions.create({
      data: { variant_id, change_quantity: qty, transaction_type: 'import', note: 'Restore tồn kho từ đơn đã huỷ (script)' },
    })
    console.log(`  ✓ variant_id=${variant_id} +${qty}`)
  }

  console.log('\nDone!')
}

main().catch(console.error).finally(() => pool.end())
