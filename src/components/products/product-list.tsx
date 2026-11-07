"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import { formatCurrency } from "@/lib/utils/format";
import type { CategoryDto, ProductDto } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorMessage, EmptyState, LoadingBlock } from "@/components/ui/feedback";
import { PriceEditSheet } from "./price-edit-sheet";
import { ProductFormModal, type ProductFormMode } from "./product-form-modal";

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
      />
    </div>
  );
}

export function ProductList() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [priceTarget, setPriceTarget] = useState<ProductDto | null>(null);
  const [formMode, setFormMode] = useState<ProductFormMode | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([
        fetchJSON<{ products: ProductDto[] }>("/api/products"),
        fetchJSON<{ categories: CategoryDto[] }>("/api/categories"),
      ]);
      setProducts(p.products);
      setCategories(c.categories);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const grouped = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        items: filtered.filter((p) => p.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filtered]);

  function handleSaved(product: ProductDto) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists
        ? prev.map((p) => (p.id === product.id ? product : p))
        : [...prev, product];
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Produk</h1>
          <p className="text-sm text-zinc-600">
            {products.length} produk · {categories.length} kategori
          </p>
        </div>
        <Button onClick={() => setFormMode({ type: "create" })}>Tambah</Button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Cari produk..." />

      {loading && <LoadingBlock />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && grouped.length === 0 && (
        <EmptyState
          message={query ? "Tidak ada produk yang cocok." : "Belum ada produk. Tambahkan produk pertama."}
        />
      )}

      {!loading &&
        !error &&
        grouped.map(({ category, items }) => (
          <section key={category.id} className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                {category.name}
                {!category.isActive && <Badge tone="danger" className="ml-2">Nonaktif</Badge>}
              </h2>
              <span className="text-xs text-zinc-400">{items.length}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {items.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-3 last:border-b-0 ${
                    !product.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <Link
                      href={`/products/${product.id}`}
                      className="block truncate text-sm font-semibold text-zinc-900 hover:text-amber-700"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-900">
                        {formatCurrency(product.sellingPrice)}
                      </span>
                      {!product.isActive && (
                        <Badge tone="inactive">Nonaktif</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      className="px-3"
                      onClick={() =>
                        setFormMode({ type: "edit", product })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="primary"
                      className="px-3"
                      onClick={() => setPriceTarget(product)}
                    >
                      Ubah Harga
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

      {priceTarget && (
        <PriceEditSheet
          product={priceTarget}
          onClose={() => setPriceTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {formMode && (
        <ProductFormModal
          mode={formMode}
          categories={categories}
          onClose={() => setFormMode(null)}
          onSaved={handleSaved}
          onDeleted={(productId) =>
            setProducts((prev) => prev.filter((p) => p.id !== productId))
          }
        />
      )}
    </div>
  );
}