import { withErrorHandling } from "@/lib/errors/handler";
import { authenticateDisplay } from "@/lib/auth/display-token";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

type DisplayCategory = {
  id: number;
  name: string;
  products: { id: number; name: string; price: number }[];
};

export const GET = withErrorHandling(async (request: Request) => {
  await authenticateDisplay(request);

  const products = await prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    orderBy: [
      { category: { displayOrder: "asc" } },
      { category: { name: "asc" } },
      { displayOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
    },
  });

  const categoryMap = new Map<number, DisplayCategory>();
  let updatedAt: Date | null = null;

  for (const p of products) {
    if (!updatedAt || p.updatedAt > updatedAt) updatedAt = p.updatedAt;

    const entry = categoryMap.get(p.category.id);
    if (entry) {
      entry.products.push({ id: p.id, name: p.name, price: p.sellingPrice });
    } else {
      categoryMap.set(p.category.id, {
        id: p.category.id,
        name: p.category.name,
        products: [{ id: p.id, name: p.name, price: p.sellingPrice }],
      });
    }
  }

  return ok({
    updated_at: updatedAt ? updatedAt.toISOString() : null,
    categories: [...categoryMap.values()],
  });
});