"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import type { DisplayPricesDto } from "@/lib/api-types";

type CategoryInput = DisplayPricesDto["categories"][number];
type ProductInput = CategoryInput["products"][number];

/** Satu blok kategori dalam satu kolom halaman. */
export type PageBlock = {
  categoryId: number;
  categoryName: string;
  products: ProductInput[];
};

/** Satu halaman = tumpukan blok per kolom (1 kolom layar kecil, 2 kolom desktop). */
export type DisplayPage = {
  columns: PageBlock[][];
};

/** Breakpoint kolom ganda mengikuti `lg:` (1024px) seperti layout V1. */
const WIDE_BREAKPOINT = "(min-width: 1024px)";
/** Minimal baris per halaman agar header (1 slot) + 1 produk selalu muat. */
const MIN_ROWS_PER_PAGE = 2;
/** Tinggi baris fallback bila probe belum terukur. */
const FALLBACK_ROW_HEIGHT_PX = 76;
/** Cadangan tinggi untuk gap antar-blok agar halaman tidak overflow. */
const CHROME_RESERVE_PX = 72;

/**
 * Algoritma pembangunan halaman (System Plan V2 §39).
 *
 * Stream linear: header kategori memakan 1 slot, tiap produk 1 slot.
 * Kolom diisi berurutan; kategori yang tidak muat dilanjutkan ke
 * kolom/halaman berikutnya dengan header diulang (§38).
 *
 * Jaminan: tidak ada produk hilang/duplikat, tidak ada halaman kosong,
 * tiap blok memuat ≥1 produk.
 */
export function buildPages(
  categories: CategoryInput[],
  rowsPerPage: number,
  columns: number
): DisplayPage[] {
  const cap = Math.max(MIN_ROWS_PER_PAGE, Math.floor(rowsPerPage));
  const cols = Math.max(1, Math.floor(columns));
  const pages: DisplayPage[] = [];
  let current: PageBlock[][] = Array.from({ length: cols }, () => []);
  let col = 0;
  let fill = 0;

  const advance = () => {
    col += 1;
    if (col >= cols) {
      pages.push({ columns: current });
      current = Array.from({ length: cols }, () => []);
      col = 0;
    }
    fill = 0;
  };

  for (const category of categories) {
    let remaining = category.products;
    if (remaining.length === 0) continue;
    while (remaining.length > 0) {
      if (cap - fill < 2) advance();
      const take = Math.min(remaining.length, cap - fill - 1);
      current[col].push({
        categoryId: category.id,
        categoryName: category.name,
        products: remaining.slice(0, take),
      });
      fill += 1 + take;
      remaining = remaining.slice(take);
      if (remaining.length > 0) advance();
    }
  }

  if (current.some((c) => c.length > 0)) pages.push({ columns: current });
  return pages;
}

export function ProductRow({ product }: { product: ProductInput }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-800/70 bg-zinc-900/40 px-5 py-4 last:border-b-0">
      <span className="min-w-0 truncate text-2xl font-medium text-white sm:text-3xl">
        {product.name}
      </span>
      <span className="shrink-0 text-3xl font-bold text-white sm:text-4xl">
        {formatCurrency(product.price)}
      </span>
    </div>
  );
}

export function CategorySection({ block }: { block: PageBlock }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold uppercase tracking-widest text-amber-400">
        {block.categoryName}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        {block.products.map((product) => (
          <ProductRow key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

/**
 * Grid display dengan pagination otomatis (System Plan V2 Stage 2).
 *
 * - Mengukur viewport via ResizeObserver → kapasitas dinamis (§36-37).
 * - Rotasi loop dengan satu interval; pause dikontrol via prop `paused` (§41-42, §47).
 * - Statis (tanpa timer) bila seluruh data muat satu halaman (§40).
 */
export function PagedGrid({
  categories,
  rotateSeconds,
  paused,
  onPageChange,
}: {
  categories: CategoryInput[];
  rotateSeconds: number;
  paused: boolean;
  onPageChange?: (page: number, total: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const probeRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<DisplayPage[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [wide, setWide] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia(WIDE_BREAKPOINT).matches
      : false
  );

  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rowHeight = probeRef.current?.offsetHeight || FALLBACK_ROW_HEIGHT_PX;
    const available = Math.max(0, container.clientHeight - CHROME_RESERVE_PX);
    const rows = Math.max(
      MIN_ROWS_PER_PAGE,
      Math.floor(available / rowHeight)
    );
    const next = buildPages(categories, rows, wide ? 2 : 1);
    setPages(next);
    setPageIndex((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
  }, [categories, wide]);

  // Pengukuran awal didefer agar tidak set-state sinkron di dalam effect.
  useEffect(() => {
    const timer = setTimeout(recalc, 0);
    return () => clearTimeout(timer);
  }, [recalc]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => recalc());
    observer.observe(el);
    return () => observer.disconnect();
  }, [recalc]);

  useEffect(() => {
    const query = window.matchMedia(WIDE_BREAKPOINT);
    const apply = (e: MediaQueryListEvent) => setWide(e.matches);
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (paused || pages.length <= 1) return;
    const id = setInterval(() => {
      setPageIndex((i) => (i + 1) % pages.length);
    }, Math.max(1, rotateSeconds) * 1000);
    return () => clearInterval(id);
  }, [paused, pages.length, rotateSeconds]);

  useEffect(() => {
    onPageChange?.(pageIndex, pages.length);
  }, [pageIndex, pages.length, onPageChange]);

  if (pages.length === 0) return null;

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
      {/* Probe tak terlihat untuk mengukur tinggi satu baris produk. */}
      <div
        ref={probeRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 top-0"
      >
        <ProductRow product={{ id: -1, name: "Contoh Produk", price: 0 }} />
      </div>
      {pages.map((page, i) => (
        <div
          key={i}
          aria-hidden={i !== pageIndex}
          className={`absolute inset-0 transition-all duration-500 ease-out ${
            i === pageIndex
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-6 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {page.columns.map((blocks, colIndex) => (
              <div key={colIndex} className="min-w-0 space-y-8">
                {blocks.map((block) => (
                  <CategorySection
                    key={block.categoryId}
                    block={block}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
