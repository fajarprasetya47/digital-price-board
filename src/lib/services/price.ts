import "server-only";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors/api-error";
import { Prisma } from "../../../generated/prisma/client";

type Tx = Prisma.TransactionClient;

export type PriceChangeResult =
  | {
      changed: true;
      oldPrice: number;
      newPrice: number;
      historyId: number;
    }
  | {
      changed: false;
      oldPrice: number;
    };

async function applyPriceChange(
  client: Tx,
  productId: number,
  newPrice: number,
  changedBy: number
): Promise<PriceChangeResult> {
  const product = await client.product.findUnique({
    where: { id: productId },
    select: { sellingPrice: true },
  });

  if (!product) {
    throw notFound("Produk tidak ditemukan.");
  }

  if (product.sellingPrice === newPrice) {
    return { changed: false, oldPrice: product.sellingPrice };
  }

  const history = await client.priceHistory.create({
    data: { productId, oldPrice: product.sellingPrice, newPrice, changedBy },
  });

  await client.product.update({
    where: { id: productId },
    data: { sellingPrice: newPrice },
  });

  return {
    changed: true,
    oldPrice: product.sellingPrice,
    newPrice,
    historyId: history.id,
  };
}

/**
 * Update harga secara transaksional (Section 32).
 * Riwayat hanya dibuat jika harga berubah (Section 11).
 * Dipakai oleh endpoint quick-price & form produk.
 */
export async function changeSellingPrice(
  productId: number,
  newPrice: number,
  changedBy: number
): Promise<PriceChangeResult> {
  return prisma.$transaction((tx) =>
    applyPriceChange(tx, productId, newPrice, changedBy)
  );
}

/**
 * Varian untuk dipakai di dalam transaksi yang sudah dibuka pemanggil
 * (mis. PATCH /api/products/[id] yang mengubah beberapa field sekaligus).
 */
export async function changeSellingPriceWithTx(
  tx: Tx,
  productId: number,
  newPrice: number,
  changedBy: number
): Promise<PriceChangeResult> {
  return applyPriceChange(tx, productId, newPrice, changedBy);
}