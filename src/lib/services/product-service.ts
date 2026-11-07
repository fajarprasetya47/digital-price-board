import "server-only";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors/api-error";
import { Prisma } from "../../../generated/prisma/client";

export const productSelect = {
  id: true,
  categoryId: true,
  name: true,
  sellingPrice: true,
  isActive: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} satisfies Prisma.ProductSelect;

export function productToDto(product: {
  id: number;
  categoryId: number;
  name: string;
  sellingPrice: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  category: { id: number; name: string };
}) {
  return {
    id: product.id,
    name: product.name,
    sellingPrice: product.sellingPrice,
    isActive: product.isActive,
    displayOrder: product.displayOrder,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    categoryId: product.categoryId,
    categoryName: product.category.name,
  };
}

export async function getProductOr404(productId: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: productSelect,
  });
  if (!product) {
    throw notFound("Produk tidak ditemukan.");
  }
  return product;
}