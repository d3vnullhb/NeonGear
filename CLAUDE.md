# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NeonGear** — a gaming gear e-commerce platform (keyboards, mice, headsets) built as a monorepo with an Express.js backend and a React frontend (`/client`).

## Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Run database migrations
npx prisma migrate dev --name <migration_name>

# Start backend dev server (once ts-node/tsx is configured)
npx tsx src/app.ts

# Install dependencies
npm install
```

> Note: TypeScript execution (ts-node / tsx) and a `dev` npm script are not yet configured in `package.json`. Add them as the project is bootstrapped.

## Architecture

### Stack

- **Backend**: Node.js v22, Express.js v5, TypeScript
- **ORM**: Prisma (client generated to `generated/prisma/`, config in `prisma.config.ts`)
- **Auth**: JWT (`jsonwebtoken`) + `bcrypt`
- **File upload**: Multer → Cloudinary (files never stored on server)
- **Database**: PostgreSQL, DB name `neongear`, 23 tables
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, React Router v6, Context API

### Backend — MVC Pattern

Request flow: `Route → Controller → Service (Model) → Response`

```
src/
  app.ts                  # Express app entry point
  config/
    db.ts                 # Prisma client singleton (imports from generated/prisma)
    cloudinary.ts         # Cloudinary config
  middlewares/
    auth.middleware.ts    # Verify JWT
    admin.middleware.ts   # Require admin role
  models/                 # Service layer — all Prisma queries live here
  controllers/            # Handle req/res, call services, return JSON
  routes/
    index.ts              # Aggregates all routes
    admin/                # Admin-only route definitions
```

All routes are prefixed `/api/v1`. Admin routes use both `authMiddleware` and `adminMiddleware`.

### Prisma Client

```typescript
// src/config/db.ts
import { PrismaClient } from '../generated/prisma'
const prisma = new PrismaClient()
export default prisma
```

The Prisma client output path is `generated/prisma/` (excluded from git via `.gitignore`).

## Coding Conventions

- **Async/await** only — no callbacks or raw `.then()` chains
- **Try/catch** in every controller
- **All Prisma queries in service layer** (`models/`) — controllers must not query the DB directly
- **Soft delete**: tables with `deleted_at` use `where: { deleted_at: null }` on reads and `update({ data: { deleted_at: new Date() } })` on deletes — never use Prisma's `delete()` on these tables
- **Pagination**: default `page=1, limit=20`; always return `{ total, totalPages, page, limit }`

### Standard Response Shape

```json
{ "success": true, "message": "...", "data": {}, "pagination": {} }
{ "success": false, "message": "...", "errors": [] }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 400 | Validation / bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 500 | Server error |

## Database Schema Groups

| Group | Tables |
|-------|--------|
| Master data | `users`, `categories`, `brands`, `attributes`, `order_status`, `coupons` |
| Product catalog | `products`, `product_variants`, `product_images`, `product_attribute_values` |
| Inventory | `inventory`, `inventory_transactions` |
| Cart & Wishlist | `carts`, `cart_items`, `wishlists` |
| Orders | `orders`, `order_details`, `order_status_history`, `coupon_usages` |
| Reviews | `reviews`, `review_images` |
| Content | `posts`, `contacts` |

Soft delete is implemented on: `users`, `categories`, `brands`, `products`, `product_variants`, `coupons`, `reviews`, `posts`.

## Frontend UI Design System

**Dark Neumorphism + Neon Blue** theme:

```
Background:   #0a0a0f    Surface: #12121a    Surface raised: #1a1a26
Neon Blue:    #00b4ff    Neon Cyan: #00e5ff
Text:         #e8e8f0    Muted: #6b6b8a     Border: #1e1e30
Success:      #00ff9d    Warning: #ffb800    Error: #ff4d6a
```

Fonts: **Space Grotesk** (headings) + **Inter** (body). Border-radius: 12–16px cards, 8px buttons/inputs. Transitions: 200–300ms.

```css
/* Raised card */  box-shadow: 6px 6px 12px #06060c, -6px -6px 12px #1e1e2e;
/* Inset input */  box-shadow: inset 4px 4px 8px #06060c, inset -4px -4px 8px #1e1e2e;
/* Neon glow */    box-shadow: 0 0 10px rgba(0,180,255,0.4), 0 0 20px rgba(0,180,255,0.2);
```

### Frontend Route Protection

- `/admin/*` — redirect to `/login` if not authenticated or not admin
- `/profile/*`, `/cart`, `/checkout`, `/wishlist` — redirect to `/login` if unauthenticated
- `/login`, `/register` — redirect to `/` if already authenticated

### Layouts

- **User**: `<Navbar>` (logo, menu, search, account, cart sidebar) → `<Outlet>` → `<Footer>`
- **Admin**: `<Sidebar>` + `<TopBar>` → `<Outlet>`
