import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined
    prismaClientVersion: number | undefined
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

// Bump after schema changes so the dev server drops a stale Prisma client.
const PRISMA_CLIENT_VERSION = 5

const prisma =
  globalForPrisma.prisma && globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION
    ? globalForPrisma.prisma
    : new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION
}

export default prisma