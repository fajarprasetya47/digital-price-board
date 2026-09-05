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

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Nama produk wajib diisi.").optional(),
    categoryId: z
      .number()
      .int()
      .positive("Kategori wajib dipilih.")
      .optional(),
    sellingPrice: z
      .number()
      .int()
      .min(0, "Harga jual tidak boleh kurang dari 0.")
      .optional(),
    isActive: z.boolean().optional(),
    displayOrder: z
      .number()
      .int()
      .min(0, "Urutan harus angka >= 0.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Tidak ada field yang dikirim.");

export const priceSchema = z.object({
  sellingPrice: z
    .number()
    .int()
    .min(0, "Harga jual tidak boleh kurang dari 0."),
});