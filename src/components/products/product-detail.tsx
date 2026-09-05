"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import {
  formatCurrency,
  formatDateTime,
} from "@/lib/utils/format";
import type {
  CategoryDto,
  PriceHistoryDto,
  ProductDto,
} from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorMessage, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { PriceEditSheet } from "./price-edit-sheet";
import { ProductFormModal, type ProductFormMode } from "./product-form-modal";

export function ProductDetail({ productId }: { productId: number }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [history, setHistory] = useState<PriceHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, h, c] = await Promise.all([
        fetchJSON<{ product: ProductDto }>(`/api/products/${productId}`),
        fetchJSON<{ history: PriceHistoryDto[] }>(
          `/api/products/${productId}/price-history`
        ),
        fetchJSON<{ categories: CategoryDto[] }>("/api/categories"),
      ]);
      setProduct(p.product);
      setHistory(h.history);
      setCategories(c.categories);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!product) return <EmptyState message="Produk tidak ditemukan." />;

  return (
    <div className="space-y-5">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        <span aria-hidden>←</span> Kembali ke produk
      </Link>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{product.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">{product.categoryName}</p>
            <div className="mt-2 flex items-center gap-2">
              {product.isActive ? (
                <Badge tone="success">Aktif</Badge>
              ) : (
                <Badge tone="inactive">Nonaktif</Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              className="px-3"
              onClick={() =>
                setFormMode({ type: "edit", product })
              }
            >
              Edit
            </Button>
            <Button className="px-3" onClick={() => setPriceOpen(true)}>
              Ubah Harga
            </Button>
          </div>
        </div>
        <p className="mt-5 text-3xl font-bold text-zinc-900">
          {formatCurrency(product.sellingPrice)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Dipakai display sejak{" "}
          {formatDateTime(product.updatedAt)}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-zinc-500">
          Riwayat Harga
        </h2>
        {history.length === 0 ? (
          <EmptyState message="Belum ada perubahan harga." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {history.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {formatCurrency(item.newPrice)}
                    <span className="mx-2 text-zinc-300">→</span>
                    {item.oldPrice !== item.newPrice && (
                      <span className="font-normal text-zinc-500 line-through">
                        {formatCurrency(item.oldPrice)}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatDateTime(item.createdAt)} · diubah oleh{" "}
                    {item.changedBy.name}
                  </p>
                </div>
                {index === 0 && <Badge tone="warn">Terbaru</Badge>}
              </div>
            ))}
          </div>
        )}
      </section>

      {priceOpen && product && (
        <PriceEditSheet
          product={product}
          onClose={() => setPriceOpen(false)}
          onSaved={(updated) => {
            setProduct(updated);
            load();
          }}
        />
      )}

      {formMode && product && (
        <ProductFormModal
          mode={formMode}
          categories={categories}
          onClose={() => setFormMode(null)}
          onSaved={(updated) => {
            setProduct(updated);
            load();
          }}
        />
      )}
    </div>
  );
}