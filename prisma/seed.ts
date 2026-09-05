import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb(
  process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://")
);
const prisma = new PrismaClient({ adapter });

async function main() {
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "owner123";
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      name: "Owner",
      email: "owner@example.com",
      passwordHash,
      role: "OWNER",
    },
  });

  const categories = [
    { name: "Pakan Ayam", displayOrder: 1 },
    { name: "Pakan Ikan", displayOrder: 2 },
    { name: "Vitamin", displayOrder: 3 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { displayOrder: c.displayOrder, isActive: true },
      create: c,
    });
  }

  const pakanAyam = await prisma.category.findUniqueOrThrow({
    where: { name: "Pakan Ayam" },
  });
  const pakanIkan = await prisma.category.findUniqueOrThrow({
    where: { name: "Pakan Ikan" },
  });

  const products = [
    { categoryId: pakanAyam.id, name: "Bravo 511", sellingPrice: 395000, displayOrder: 1 },
    { categoryId: pakanAyam.id, name: "Bravo 512", sellingPrice: 405000, displayOrder: 2 },
    { categoryId: pakanAyam.id, name: "Comfeed A", sellingPrice: 410000, displayOrder: 3 },
    { categoryId: pakanIkan.id, name: "Lele 781", sellingPrice: 320000, displayOrder: 1 },
    { categoryId: pakanIkan.id, name: "Lele 782", sellingPrice: 335000, displayOrder: 2 },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { categoryId: p.categoryId, name: p.name },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { sellingPrice: p.sellingPrice, displayOrder: p.displayOrder, isActive: true },
      });
    } else {
      await prisma.product.create({
        data: {
          ...p,
          priceHistories: {
            create: {
              oldPrice: p.sellingPrice,
              newPrice: p.sellingPrice,
              changedBy: owner.id,
            },
          },
        },
      });
    }
  }

  console.log("Seed selesai. Owner:", owner.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });