"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { fetchJSON } from "@/lib/client/api";
import type { ProductDto } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CheckIcon } from "@/components/ui/icons";
import { Field, Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/feedback";

export function PriceEditSheet({
  product,
  onClose,
  onSaved,
}: {
  product: ProductDto;
  onClose: () => void;
  onSaved: (product: ProductDto) => void;
}) {
  const [price, setPrice] = useState(String(product.sellingPrice));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(price);
    if (!Number.isInteger(value) || value < 0) {
      setError("Harga harus angka bulat >= 0.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetchJSON<{ product: ProductDto }>(
        `/api/products/${product.id}/price`,
        { method: "PATCH", body: { sellingPrice: value } }
      );
      onSaved(res.product);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah harga.");
      setSaving(false);
    }
  }

  const current = formatCurrency(product.sellingPrice);

  return (
    <Modal
      open
      onClose={onClose}
      title="Ubah Harga"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="price-form" loading={saving}>
            <CheckIcon />
            Simpan
          </Button>
        </>
      }
    >
      <form id="price-form" onSubmit={onSubmit}>
        <p className="text-sm font-medium text-zinc-800">{product.name}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          Harga saat ini: {current}
        </p>
        {error && <div className="mt-3"><ErrorMessage message={error} /></div>}
        <div className="mt-4">
          <Field label="Harga Jual Baru">
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}