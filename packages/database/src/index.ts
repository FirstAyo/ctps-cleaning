import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

interface PrismaGlobal {
  __ctpsPrisma?: PrismaClient;
}

const prismaGlobal = globalThis as typeof globalThis & PrismaGlobal;

export const prisma = prismaGlobal.__ctpsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  prismaGlobal.__ctpsPrisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export async function checkDatabaseConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
