import { z } from "zod";
import { validationError } from "@/lib/errors/api-error";

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw validationError(
      issue?.message ?? "Input tidak valid.",
      issue ? { field: issue.path.join(".") } : undefined
    );
  }
  return result.data;
}