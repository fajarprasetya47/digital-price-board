import { withErrorHandling } from "@/lib/errors/handler";
import { validationError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok, created } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { productSchema } from "@/lib/validation/product";
import {
  productSelect,
  productToDto,
} from "@/lib/services/product-service";
import { Prisma } from "../../../../generated/prisma/client";

export const GET = withErrorHandling(async (request: Request) => {
  await requireApiUser();

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  const categoryId = url.searchParams.get("categoryId");
  const active = url.searchParams.get("active");

  const where: Prisma.ProductWhereInput = { deletedAt: null };
  if (q) where.name = { contains: q };
  if (categoryId) {
    const parsed = Number(categoryId);
    if (Number.isInteger(parsed) && parsed > 0) where.categoryId = parsed;
  }
  if (active === "true") where.isActive = true;
  else if (active === "false") where.isActive = false;

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { category: { displayOrder: "asc" } },
      { category: { name: "asc" } },
      { displayOrder: "asc" },
      { name: "asc" },
    ],
    select: productSelect,
  });

  return ok({ products: products.map(productToDto) });
});

export const POST = withErrorHandling(async (request: Request) => {
  await requireApiUser();

  const body = await readJson(request);
  const data = parseOrThrow(productSchema, body);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw validationError("Kategori tidak ditemukan.");
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      sellingPrice: data.sellingPrice,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    },
    select: productSelect,
  });

  return created({ product: productToDto(product) });
});