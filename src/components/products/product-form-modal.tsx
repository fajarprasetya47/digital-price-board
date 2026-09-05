"use client";

import { useState } from "react";
import { fetchJSON } from "@/lib/client/api";
import type { CategoryDto, ProductDto } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/feedback";

export type ProductFormMode =
  | { type: "create" }
  | { type: "edit"; product: ProductDto };

export function ProductFormModal({
  mode,
  categories,
  onClose,
  onSaved,
}: {
  mode: ProductFormMode;
  categories: CategoryDto[];
  onClose: () => void;
  onSaved: (product: ProductDto) => void;
}) {
  const isEdit = mode.type === "edit";
  const initial = isEdit ? mode.product : null;

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    initial ? String(initial.categoryId) : (categories[0]?.id ?? "")
  );
  const [sellingPrice, setSellingPrice] = useState(
    initial ? String(initial.sellingPrice) : ""
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [displayOrder, setDisplayOrder] = useState(
    initial ? String(initial.displayOrder) : "0"
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(sellingPrice);
    const order = Number(displayOrder);
    const catId = Number(categoryId);
    if (!name.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!categories.some((c) => c.id === catId)) {
      setError("Kategori wajib dipilih.");
      return;
    }
    if (!Number.isInteger(price) || price < 0) {
      setError("Harga harus angka bulat >= 0.");
      return;
    }
    if (!Number.isInteger(order) || order < 0) {
      setError("Urutan display harus angka >= 0.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        categoryId: catId,
        sellingPrice: price,
        isActive,
        displayOrder: order,
      };
      if (isEdit) {
        const res = await fetchJSON<{ product: ProductDto }>(
          `/api/products/${mode.product.id}`,
          { method: "PATCH", body }
        );
        onSaved(res.product);
      } else {
        const res = await fetchJSON<{ product: ProductDto }>("/api/products", {
          method: "POST",
          body,
        });
        onSaved(res.product);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Ubah Produk" : "Tambah Produk"}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="product-form" loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="space-y-4">
        {error && <ErrorMessage message={error} />}
        <Field label="Nama Produk">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Bravo 511"
          />
        </Field>
        <Field label="Kategori">
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Harga Jual">
          <Input
            type="number"
            min={0}
            inputMode="numeric"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="395000"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Urutan Display" hint="Semakin kecil semakin atas">
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