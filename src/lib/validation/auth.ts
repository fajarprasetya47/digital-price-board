import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password lama wajib diisi."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter."),
});