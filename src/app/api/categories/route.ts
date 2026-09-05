import { withErrorHandling } from "@/lib/errors/handler";
import { validationError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok, created } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { categorySchema } from "@/lib/validation/category";

function toDto(category: {
  id: number;
  name: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number };
}) {
  return {
    id: category.id,
    name: category.name,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    productCount: category._count.products,
  };
}

export const GET = withErrorHandling(async () => {
  await requireApiUser();

  const categories = await prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      isActive: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { products: true } },
    },
  });

  return ok({ categories: categories.map(toDto) });
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireApiUser();

  const body = await readJson(request);
  const data = parseOrThrow(categorySchema, body);

  const exists = await prisma.category.findFirst({
    where: { name: data.name },
  });
  if (exists) {
    throw validationError("Nama kategori sudah digunakan.");
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    },
  });

  return created({ category: toDto({ ...category, _count: { products: 0 } }) });
});