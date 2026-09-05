import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi."),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0, "Urutan harus angka >= 0.").optional(),
});