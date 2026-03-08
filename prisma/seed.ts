import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Seed order statuses
  const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']
  for (const name of statuses) {
    await prisma.order_status.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log('Seeded order_status:', statuses)

  // Seed a test coupon
  await prisma.coupons.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discount_type: 'percent',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: 200000,
      per_user_limit: 100,
      usage_limit: 1000,
      is_active: true,
    },
  })
  console.log('Seeded test coupon: WELCOME10 (10% off, max 200,000đ)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
