import { withErrorHandling } from "@/lib/errors/handler";
import { validationError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok } from "@/lib/utils/api";
import { getPositiveId } from "@/lib/utils/params";
import { parseOrThrow } from "@/lib/validation";
import { productUpdateSchema } from "@/lib/validation/product";
import {
  productSelect,
  productToDto,
} from "@/lib/services/product-service";
import {
  changeSellingPriceWithTx,
} from "@/lib/services/price";

export const GET = withErrorHandling(
  async (_request: Request, ctx: RouteContext<"/api/products/[id]">) => {
    await requireApiUser();

    const id = await getPositiveId(ctx.params);
    const product = await prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!product) {
      throw validationError("Produk tidak ditemukan.");
    }

    return ok({ product: productToDto(product) });
  }
);

export const PATCH = withErrorHandling(
  async (request: Request, ctx: RouteContext<"/api/products/[id]">) => {
    const user = await requireApiUser();

    const id = await getPositiveId(ctx.params);
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, sellingPrice: true },
    });
    if (!existing) {
      throw validationError("Produk tidak ditemukan.");
    }

    const body = await readJson(request);
    const data = parseOrThrow(productUpdateSchema, body);

    if (data.categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw validationError("Kategori tidak ditemukan.");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          categoryId: data.categoryId,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
        },
      });

      if (
        data.sellingPrice !== undefined &&
        data.sellingPrice !== existing.sellingPrice
      ) {
        await changeSellingPriceWithTx(tx, id, data.sellingPrice, user.id);
      }
    });

    const updated = await prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });

    return ok({ product: updated ? productToDto(updated) : null });
  }
);