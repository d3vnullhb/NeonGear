/**
 * Keep discounts on only 4-5 products, remove from the rest.
 * Run: npx tsx fix-discounts.ts
 */
import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // Keep discounts only on these variant_ids (one per product, 5 products)
  const keepDiscount = new Set([1, 4, 9, 13, 14])
  // variant 1  = Keychron K2 Pro (BLK-RED)
  // variant 4  = Akko 3087 Ocean Star
  // variant 9  = Razer DeathAdder V3
  // variant 13 = HyperX Cloud II Wireless
  // variant 14 = Razer BlackShark V2 X

  const all = await prisma.product_variants.findMany({ select: { variant_id: true, compare_price: true, products: { select: { name: true } } } })

  for (const v of all) {
    if (keepDiscount.has(v.variant_id)) {
      console.log(`✓ keep  variant_id=${v.variant_id} | ${v.products?.name}`)
    } else if (v.compare_price !== null) {
      await prisma.product_variants.update({
        where: { variant_id: v.variant_id },
        data: { compare_price: null },
      })
      console.log(`✗ clear variant_id=${v.variant_id} | ${v.products?.name}`)
    }
  }

  console.log('\nDone!')
}

main().catch(console.error).finally(() => pool.end())
