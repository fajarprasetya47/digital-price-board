import { withErrorHandling } from "@/lib/errors/handler";
import { ApiError, ERROR_CODES, notFound, validationError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { categoryUpdateSchema } from "@/lib/validation/category";

export async function getCategoryId(
  params: Promise<{ id: string }>
): Promise<number> {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw notFound("Kategori tidak ditemukan.");
  }
  return parsed;
}

export const GET = withErrorHandling(async (_request: Request, ctx: RouteContext<"/api/categories/[id]">) => {
  await requireApiUser();

  const id = await getCategoryId(ctx.params);
  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      isActive: true,
      displayOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  if (!category) {
    throw notFound("Kategori tidak ditemukan.");
  }

  return ok({
    category: {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
      productCount: category._count.products,
    },
  });
});

export const PATCH = withErrorHandling(async (request: Request, ctx: RouteContext<"/api/categories/[id]">) => {
  await requireApiUser();

  const id = await getCategoryId(ctx.params);
  const exists = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    throw notFound("Kategori tidak ditemukan.");
  }

  const body = await readJson(request);
  const data = parseOrThrow(categoryUpdateSchema, body);

  if (data.name !== undefined) {
    const duplicate = await prisma.category.findFirst({
      where: { name: data.name, id: { not: id } },
    });
    if (duplicate) {
      throw validationError("Nama kategori sudah digunakan.");
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      isActive: data.isActive,
      displayOrder: data.displayOrder,
    },
  });

  return ok({
    category: {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      displayOrder: category.displayOrder,
    },
  });
});

export const DELETE = withErrorHandling(async (_request: Request, ctx: RouteContext<"/api/categories/[id]">) => {
  await requireApiUser();

  const id = await getCategoryId(ctx.params);
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, _count: { select: { products: true } } },
  });
  if (!category) {
    throw notFound("Kategori tidak ditemukan.");
  }

  // Produk yang sudah dihapus (soft delete) tetap dihitung: relasinya
  // masih ada di database dan riwayat harganya perlu dipertahankan.
  if (category._count.products > 0) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      "Kategori tidak bisa dihapus karena masih memiliki produk (termasuk produk yang sudah dihapus). Nonaktifkan kategori ini sebagai gantinya.",
      { status: 422 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return ok({ deleted: true });
});