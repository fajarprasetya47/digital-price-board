import "server-only";
import { PrismaClient } from "../../../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

function createAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL tidak diset pada environment.");
  }
  return new PrismaMariaDb(url.replace(/^mysql:\/\//, "mariadb://"));
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}