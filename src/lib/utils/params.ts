import { notFound } from "@/lib/errors/api-error";

export async function getPositiveId(
  params: Promise<{ id: string }>
): Promise<number> {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw notFound("Data tidak ditemukan.");
  }
  return parsed;
}