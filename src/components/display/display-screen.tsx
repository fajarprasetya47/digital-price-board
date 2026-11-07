"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import type { DisplayPricesDto } from "@/lib/api-types";
import type { DisplayMode } from "@/app/(display)/display/[token]/page";
import { CategorySection, PagedGrid } from "./paged-grid";

const POLL_INTERVAL_MS = 60_000;
const STALE_AFTER_MS = 5 * 60_000;
const CACHE_PREFIX = "dpb_display_cache_";

type Status = "online" | "offline" | "syncing" | "error";
type CacheEntry = { data: DisplayPricesDto; savedAt: string };

function cacheKey(token: string) {
  return `${CACHE_PREFIX}${token}`;
}

function readCache(token: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(token));
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

function writeCache(token: string, entry: CacheEntry) {
  try {
    localStorage.setItem(cacheKey(token), JSON.stringify(entry));
  } catch {
    /* abaikan */
  }
}

function timeAgo(date: Date, now: number): string {
  const diffMs = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  return `${hours} jam lalu`;
}

export function DisplayScreen({
  token,
  mode,
  rotateSeconds,
}: {
  token: string;
  mode: DisplayMode;
  rotateSeconds: number;
}) {
  const [data, setData] = useState<DisplayPricesDto | null>(null);
  const [status, setStatus] = useState<Status>("syncing");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState(0);
  const [pageInfo, setPageInfo] = useState({ page: 0, total: 0 });

  // System Plan V2 §29 & §48: hanya "pages" yang diimplementasikan.
  // Mode lain (mis. future "scroller") untuk saat ini dirender dengan
  // strategi pages agar display tetap berfungsi.
  const usePagedLayout = mode === "pages" || mode === "scroller";

  const tokenRef = useRef(token);
  const dataRef = useRef<DisplayPricesDto | null>(null);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const sync = useCallback(async () => {
    try {
      const res = await fetchJSON<DisplayPricesDto>("/api/display/prices", {
        token: tokenRef.current,
      });
      setData(res);
      setLastSyncAt(new Date());
      setError(null);
      setStatus("online");
      writeCache(tokenRef.current, {
        data: res,
        savedAt: new Date().toISOString(),
      });
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setStatus("error");
        setError("Token display tidak valid. Hubungi owner.");
        return;
      }
      setStatus("offline");
      if (!dataRef.current) {
        const cached = readCache(tokenRef.current);
        if (cached) {
          setData(cached.data);
          setLastSyncAt(new Date(cached.savedAt));
        }
      }
    } finally {
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    const id = setInterval(() => {
      sync();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sync]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [sync]);

  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      /* perangkat tidak mendukung fullscreen */
    }
  }

  const handlePageChange = useCallback((page: number, total: number) => {
    setPageInfo({ page, total });
  }, []);

  const filtered = filterCategories(data, search);
  const searchActive = search.trim() !== "";

  const stale = lastSyncAt ? now - lastSyncAt.getTime() > STALE_AFTER_MS : false;

  return (
    <div className="flex h-dvh flex-col bg-zinc-950 text-zinc-50">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src="/icon-dpb.svg" alt="" width={36} height={36} />
          <h1 className="text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">
            Daftar Harga Jual
          </h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          {data?.updated_at ? (
            <span className="hidden sm:inline">
              Update: {formatClock(data.updated_at)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
            aria-label="Cari produk"
          >
            {searchOpen ? "✕" : "🔍"}
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800"
          >
            {isFullscreen ? "Keluar Layar Penuh" : "⛶"}
          </button>
        </div>
      </header>

      {/* Search (opsional) */}
      {searchOpen && (
        <div className="border-b border-zinc-800 px-6 py-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk…"
            className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-lg text-white outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Peringatan sinkronisasi */}
      {(status === "offline" || stale) && (
        <div className="bg-amber-500/15 px-6 py-3 text-center text-sm font-semibold text-amber-400">
          ⚠ Last sync: {lastSyncAt ? timeAgo(lastSyncAt, now) : "tidak tersedia"}
          {status === "offline" ? " · OFFLINE" : ""}
        </div>
      )}

      {status === "error" ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-xl text-red-400">{error}</p>
        </div>
      ) : status === "syncing" && !data ? (
        <div className="flex flex-1 items-center justify-center p-6 text-zinc-500">
          <span className="text-xl">Memuat harga…</span>
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-2xl text-zinc-600">Belum ada harga.</p>
        </div>
      ) : !usePagedLayout || searchActive ? (
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {filtered.map((category) => (
              <CategorySection
                key={category.id}
                block={{
                  categoryId: category.id,
                  categoryName: category.name,
                  products: category.products,
                }}
              />
            ))}
          </div>
        </main>
      ) : (
        <main className="flex min-h-0 flex-1 flex-col px-6 py-8">
          <PagedGrid
            categories={filtered}
            rotateSeconds={rotateSeconds}
            paused={false}
            onPageChange={handlePageChange}
          />
        </main>
      )}

      {/* Footer waktu */}
      <footer className="grid grid-cols-3 items-center gap-4 border-t border-zinc-800 px-6 py-3 text-sm text-zinc-500">
        <span className="justify-self-start">
          Last sync:{" "}
          {lastSyncAt
            ? `${formatClock(lastSyncAt.toISOString())} (${timeAgo(lastSyncAt, now)})`
            : "-"}
        </span>
        <span className="justify-self-center whitespace-nowrap text-zinc-600">
          Created by Japrasetya
        </span>
        <div className="flex items-center gap-4 justify-self-end">
          {pageInfo.total > 1 && !searchActive && (
            <span>
              Halaman {pageInfo.page + 1} / {pageInfo.total}
            </span>
          )}
          {isFullscreen && <span>Mode layar penuh aktif</span>}
        </div>
      </footer>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const config: Record<Status, { label: string; dot: string; text: string }> = {
    online: { label: "ONLINE", dot: "bg-emerald-400", text: "text-emerald-400" },
    syncing: { label: "SYNCING", dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
    offline: { label: "OFFLINE", dot: "bg-red-400", text: "text-red-400" },
    error: { label: "ERROR", dot: "bg-red-400", text: "text-red-400" },
  };
  const c = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider ${c.text}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function filterCategories(data: DisplayPricesDto | null, search: string) {
  if (!data) return null;
  const q = search.trim().toLowerCase();
  if (!q) return data.categories;
  return data.categories
    .map((c) => ({
      ...c,
      products: c.products.filter((p) => p.name.toLowerCase().includes(q)),
    }))
    .filter((c) => c.products.length > 0);
}