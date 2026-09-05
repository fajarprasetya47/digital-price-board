"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON, ApiClientError } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils/format";
import type {
  DisplayDeviceDto,
  RegisteredDisplayDto,
} from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
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

export function DisplayDeviceManager() {
  const router = useRouter();
  const [devices, setDevices] = useState<DisplayDeviceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [result, setResult] = useState<RegisteredDisplayDto | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchJSON<{ devices: DisplayDeviceDto[] }>(
        "/api/display/devices"
      );
      setDevices(res.devices);
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
              </div>
              <Button
                variant="ghost"
                className="px-3"
                loading={togglingId === device.id}
                onClick={() => toggle(device)}
              >
                {device.isActive ? "Nonaktifkan" : "Aktifkan"}
              </Button>
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
    </div>
  );
}