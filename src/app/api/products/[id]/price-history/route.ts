import { withErrorHandling } from "@/lib/errors/handler";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/utils/api";
import { getPositiveId } from "@/lib/utils/params";
import { getProductOr404 } from "@/lib/services/product-service";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(
  async (_request: Request, ctx: RouteContext<"/api/products/[id]/price-history">) => {
    await requireApiUser();

    const id = await getPositiveId(ctx.params);
    const product = await getProductOr404(id);

    const histories = await prisma.priceHistory.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        oldPrice: true,
        newPrice: true,
        createdAt: true,
        changedBy: true,
        user: { select: { name: true } },
      },
    });

    return ok({
      product: {
        id: product.id,
        name: product.name,
        currentPrice: product.sellingPrice,
      },
      history: histories.map((h) => ({
        id: h.id,
        oldPrice: h.oldPrice,
        newPrice: h.newPrice,
        createdAt: h.createdAt,
        changedBy: { id: h.changedBy, name: h.user.name },
      })),
    });
  }
);