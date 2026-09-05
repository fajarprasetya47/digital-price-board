import { z } from "zod";

export const registerDisplaySchema = z.object({
  name: z.string().trim().min(1, "Nama display wajib diisi."),
});