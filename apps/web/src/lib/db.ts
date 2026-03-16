import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Also export as 'db' for consistency with API routes
export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;