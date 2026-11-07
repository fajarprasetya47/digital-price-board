"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils/format";
import type {
  CategoryDto,
  DisplayDeviceDto,
  RegisteredDisplayDto,
} from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/input";
import { ErrorMessage, EmptyState, LoadingBlock } from "@/components/ui/feedback";

function RegisterModal({
  onClose,
  onRegistered,
}: {
  onClose: () => void;
  onRegistered: (result: RegisteredDisplayDto) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama display wajib diisi.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetchJSON<RegisteredDisplayDto>("/api/display/register", {
        method: "POST",
        body: { name: name.trim() },
      });
      onRegistered(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendaftarkan display.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Daftarkan Perangkat Display"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="register-form" loading={saving}>
            Daftarkan
          </Button>
        </>
      }
    >
      <form id="register-form" onSubmit={onSubmit}>
        {error && <div className="mb-3"><ErrorMessage message={error} /></div>}
        <Field label="Nama Display" hint="Contoh: Monitor Kasir">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Monitor Kasir"
          />
        </Field>
      </form>
    </Modal>
  );
}

function TokenResult({
  result,
  onClose,
}: {
  result: RegisteredDisplayDto;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(result.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* abaikan */
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Perangkat Terdaftar"
      footer={
        <Button onClick={onClose}>Selesai</Button>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-amber-800">
          <p className="font-semibold">Simpan token ini baik-baik.</p>
          <p className="mt-1 text-amber-700">
            Token hanya ditampilkan sekali dan tidak dapat dilihat lagi.
          </p>
        </div>
        <div>
          <p className="mb-1 font-medium text-zinc-700">Display URL</p>
          <p className="break-all rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-800">
            {result.displayUrl}
          </p>
        </div>
        <div>
          <p className="mb-1 font-medium text-zinc-700">Token</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-800">
              {result.token}
            </code>
            <Button variant="secondary" onClick={copyToken} className="px-3">
              {copied ? "Tersalin" : "Salin"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function categorySummary(device: DisplayDeviceDto): string {
  if (device.showAllCategories) return "Semua kategori";
  const names = device.categories.map((c) => c.name);
  if (names.length === 0) return "Tidak ada kategori";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} lainnya`;
}

function CategorySelectionModal({
  device,
  categories,
  onClose,
  onSaved,
}: {
  device: DisplayDeviceDto;
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: (device: DisplayDeviceDto) => void;
}) {
  const [mode, setMode] = useState<"all" | "selected">(
    device.showAllCategories ? "all" : "selected"
  );
  const [selected, setSelected] = useState<number[]>(device.categoryIds);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleCategory(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function onSubmit() {
    if (mode === "selected" && selected.length === 0) {
      setError("Pilih minimal satu kategori.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetchJSON<{ device: DisplayDeviceDto }>(
        `/api/display/devices/${device.id}`,
        {
          method: "PATCH",
          body: {
            showAllCategories: mode === "all",
            categoryIds: mode === "selected" ? selected : [],
          },
        }
      );
      onSaved(res.device);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan konfigurasi."
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Atur Kategori"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="button" onClick={onSubmit} loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-zinc-600">
          Tentukan kategori yang ditampilkan oleh{" "}
          <strong className="text-zinc-900">{device.name}</strong>.
        </p>

        <div className="space-y-2">
          <label className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name="category-mode"
              checked={mode === "all"}
              onChange={() => setMode("all")}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="font-medium text-zinc-800">Semua kategori</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <input
              type="radio"
              name="category-mode"
              checked={mode === "selected"}
              onChange={() => setMode("selected")}
              className="h-4 w-4 accent-amber-500"
            />
            <span className="font-medium text-zinc-800">Kategori tertentu</span>
          </label>
        </div>

        {mode === "selected" && (
          <div>
            <p className="mb-2 text-xs text-zinc-500">
              Pilih minimal satu kategori (kategori nonaktif tidak ditampilkan):
            </p>
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-zinc-200 p-2">
              {categories.length === 0 ? (
                <p className="px-2 py-3 text-sm text-zinc-500">
                  Belum ada kategori aktif.
                </p>
              ) : (
                categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-amber-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span className="text-zinc-700">{c.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {error && <ErrorMessage message={error} />}
      </div>
    </Modal>
  );
}

export function DisplayDeviceManager() {
  const router = useRouter();
  const [devices, setDevices] = useState<DisplayDeviceDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [result, setResult] = useState<RegisteredDisplayDto | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<DisplayDeviceDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DisplayDeviceDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [devRes, catRes] = await Promise.all([
        fetchJSON<{ devices: DisplayDeviceDto[] }>("/api/display/devices"),
        fetchJSON<{ categories: CategoryDto[] }>("/api/categories"),
      ]);
      setDevices(devRes.devices);
      setCategories(catRes.categories);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat perangkat.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function toggle(device: DisplayDeviceDto) {
    setTogglingId(device.id);
    try {
      const res = await fetchJSON<{ device: DisplayDeviceDto }>(
        `/api/display/devices/${device.id}`,
        { method: "PATCH", body: { isActive: !device.isActive } }
      );
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? res.device : d))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah perangkat.");
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await fetchJSON(`/api/display/devices/${deleteTarget.id}`, { method: "DELETE" });
      setDevices((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Gagal menghapus perangkat.");
    } finally {
      setDeleting(false);
    }
  }

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Perangkat Display</h1>
          <p className="text-sm text-zinc-600">
            {devices.length} perangkat ·{" "}
            {devices.filter((d) => d.isActive).length} aktif
          </p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>Daftarkan</Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Buka Display URL pada TV/monitor di toko. Display hanya menampilkan
        data (read-only) dan otomatis sinkron.
      </div>

      {loading && <LoadingBlock />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && devices.length === 0 && (
        <EmptyState message="Belum ada perangkat display." />
      )}

      {!loading && !error && devices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">
                    {device.name}
                  </span>
                  {device.isActive ? (
                    <Badge tone="success">Aktif</Badge>
                  ) : (
                    <Badge tone="inactive">Nonaktif</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Terakhir terhubung:{" "}
                  {device.lastSeenAt
                    ? formatDateTime(device.lastSeenAt)
                    : "belum pernah"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-amber-700">
                  {categorySummary(device)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  className="whitespace-nowrap px-3"
                  onClick={() => setEditTarget(device)}
                >
                  Atur Kategori
                </Button>
                <Button
                  variant="ghost"
                  className="px-3"
                  loading={togglingId === device.id}
                  onClick={() => toggle(device)}
                >
                  {device.isActive ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteTarget(device);
                  }}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {registerOpen && !result && (
        <RegisterModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={(res) => {
            setResult(res);
            setRegisterOpen(false);
            setDevices((prev) =>
              [...prev, res.device].sort(
                (a, b) =>
                  Number(b.isActive) - Number(a.isActive) || a.id - b.id
              )
            );
          }}
        />
      )}

      {result && (
        <TokenResult result={result} onClose={() => setResult(null)} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Hapus Perangkat Display"
          message={`Perangkat "${deleteTarget.name}" akan dihapus permanen. Layar yang memakai token ini tidak bisa lagi menampilkan harga.`}
          loading={deleting}
          error={deleteError}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {editTarget && (
        <CategorySelectionModal
          device={editTarget}
          categories={activeCategories}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setDevices((prev) =>
              prev.map((d) => (d.id === updated.id ? updated : d))
            );
            setEditTarget(null);
          }}
        />
      )}
    </div>
  );
}