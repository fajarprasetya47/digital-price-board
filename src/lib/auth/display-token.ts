import "server-only";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/errors/api-error";

/**
 * Memverifikasi token akses display dari header `x-display-token`
 * atau query parameter `token`, lalu mencatat last_seen_at.
 */
export async function authenticateDisplay(
  request: Request
): Promise<{ id: number; name: string }> {
  const url = new URL(request.url);
  const token =
    request.headers.get("x-display-token") ?? url.searchParams.get("token");

  if (!token) {
    throw unauthorized("Token display tidak ditemukan.");
  }

  const device = await prisma.displayDevice.findFirst({
    where: { displayToken: token, isActive: true },
    select: { id: true, name: true },
  });

  if (!device) {
    throw unauthorized("Token display tidak valid.");
  }

  await prisma.displayDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  return device;
}