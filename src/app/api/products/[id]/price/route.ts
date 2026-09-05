import { withErrorHandling } from "@/lib/errors/handler";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok } from "@/lib/utils/api";
import { getPositiveId } from "@/lib/utils/params";
import { parseOrThrow } from "@/lib/validation";
import { priceSchema } from "@/lib/validation/product";
import {
  changeSellingPrice,
} from "@/lib/services/price";
import {
  productSelect,
  productToDto,
} from "@/lib/services/product-service";
import { getProductOr404 } from "@/lib/services/product-service";

export const PATCH = withErrorHandling(
  async (request: Request, ctx: RouteContext<"/api/products/[id]/price">) => {
    const user = await requireApiUser();

    const id = await getPositiveId(ctx.params);
    await getProductOr404(id);

    const body = await readJson(request);
    const { sellingPrice } = parseOrThrow(priceSchema, body);

    const result = await changeSellingPrice(id, sellingPrice, user.id);

    const updated = await prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });

    return ok({
      product: updated ? productToDto(updated) : null,
      priceHistory: result.changed
        ? {
            id: result.historyId,
            oldPrice: result.oldPrice,
            newPrice: result.newPrice,
            changedBy: user.id,
          }
        : null,
      changed: result.changed,
    });
  }
);