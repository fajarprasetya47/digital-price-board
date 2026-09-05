import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi."),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0, "Urutan harus angka >= 0.").optional(),
});

export const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "Nama kategori wajib diisi.").optional(),
    isActive: z.boolean().optional(),
    displayOrder: z
      .number()
      .int()
      .min(0, "Urutan harus angka >= 0.")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Tidak ada field yang dikirim.");