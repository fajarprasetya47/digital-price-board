import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi."),
  categoryId: z.number().int().positive("Kategori wajib dipilih."),
  sellingPrice: z
    .number()
    .int()
    .min(0, "Harga jual tidak boleh kurang dari 0."),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0, "Urutan harus angka >= 0.").optional(),
});

export const priceSchema = z.object({
  sellingPrice: z
    .number()
    .int()
    .min(0, "Harga jual tidak boleh kurang dari 0."),
});