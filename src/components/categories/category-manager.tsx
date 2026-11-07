"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import type { CategoryDto } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckIcon, EditIcon, PlusIcon, PowerIcon, TrashIcon } from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search-input";
import { Field, Input } from "@/components/ui/input";
import { ErrorMessage, EmptyState, LoadingBlock } from "@/components/ui/feedback";

type FormMode = { type: "create" } | { type: "edit"; category: CategoryDto };

function CategoryFormModal({
  mode,
  onClose,
  onSaved,
}: {
  mode: FormMode;
  onClose: () => void;
  onSaved: (category: CategoryDto) => void;
}) {
  const isEdit = mode.type === "edit";
  const initial = isEdit ? mode.category : null;

  const [name, setName] = useState(initial?.name ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    initial ? String(initial.displayOrder) : "0"
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const order = Number(displayOrder);
    if (!name.trim()) {
      setError("Nama kategori wajib diisi.");
      return;
    }
    if (!Number.isInteger(order) || order < 0) {
      setError("Urutan display harus angka >= 0.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = { name: name.trim(), displayOrder: order, isActive };
      if (isEdit) {
        const res = await fetchJSON<{ category: CategoryDto }>(
          `/api/categories/${mode.category.id}`,
          { method: "PATCH", body }
        );
        onSaved(res.category);
      } else {
        const res = await fetchJSON<{ category: CategoryDto }>(
          "/api/categories",
          { method: "POST", body }
        );
        onSaved(res.category);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan kategori.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Ubah Kategori" : "Tambah Kategori"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            <CheckIcon />
            Simpan
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <Field label="Nama Kategori">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Pakan Ayam"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Urutan Display" hint="Kecil = tampil atas">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </Field>
          <Field label="Status">
            <label className="flex h-[38px] items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              <span className="text-zinc-700">Aktif</span>
            </label>
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export function CategoryManager() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetchJSON<{ categories: CategoryDto[] }>(
        "/api/categories"
      );
      setCategories(res.categories);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function toggle(category: CategoryDto) {
    setTogglingId(category.id);
    try {
      const res = await fetchJSON<{ category: CategoryDto }>(
        `/api/categories/${category.id}`,
        { method: "PATCH", body: { isActive: !category.isActive } }
      );
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? res.category : c))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await fetchJSON(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(category: CategoryDto) {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === category.id);
      return exists
        ? prev.map((c) => (c.id === category.id ? category : c))
        : [...prev, category].sort(
            (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
          );
    });
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Kategori</h1>
          <p className="text-sm text-zinc-600">
            {categories.length} kategori
          </p>
        </div>
        <Button onClick={() => setFormMode({ type: "create" })}>
          <PlusIcon />
          Tambah
        </Button>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Cari kategori..." />

      {loading && <LoadingBlock />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && categories.length === 0 && (
        <EmptyState message="Belum ada kategori." />
      )}
      {!loading && !error && categories.length > 0 && filtered.length === 0 && (
        <EmptyState message="Tidak ada kategori yang cocok." />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {filtered.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">
                    {category.name}
                  </span>
                  {category.isActive ? (
                    <Badge tone="success">Aktif</Badge>
                  ) : (
                    <Badge tone="inactive">Nonaktif</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Urutan {category.displayOrder} · {category.productCount} produk
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="secondary"
                  className="px-3"
                  onClick={() => setFormMode({ type: "edit", category })}
                >
                  <EditIcon />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="px-3"
                  loading={togglingId === category.id}
                  onClick={() => toggle(category)}
                >
                  <PowerIcon />
                  {category.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(category);
                  }}
                >
                  <TrashIcon />
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formMode && (
        <CategoryFormModal
          mode={formMode}
          onClose={() => setFormMode(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus Kategori"
          message={`Kategori "${deleteTarget.name}" akan dihapus permanen. Kategori hanya bisa dihapus jika sudah tidak memiliki produk.`}
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}