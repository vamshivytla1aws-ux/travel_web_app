# Employee Transport Management System

Next.js + TypeScript + Tailwind + shadcn/ui + PostgreSQL (`pg`) implementation using raw SQL and repository/service layers.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL with `pg` (no ORM, no Prisma)

## Setup
1. Update `.env` with your PostgreSQL values.
2. Run:
   - `npm install`
   - `npm run db:seed`
   - `npm run dev`
3. Open `http://localhost:3000`.

## Default Login
- Email: `admin@transport.local`
- Password: `Admin@123`

## Important Files
- `schema.sql` - database schema
- `scripts/seed.ts` - realistic seed data generator
- `src/lib/db.ts` - database pool and transaction helper
- `src/repositories/*` - SQL repository layer
- `src/services/*` - business logic/service layer
- `src/app/dashboard/page.tsx` - dashboard
- `src/app/buses/page.tsx` and `src/app/buses/[id]/page.tsx` - bus list and detail
