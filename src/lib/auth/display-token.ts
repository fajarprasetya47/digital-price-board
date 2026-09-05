import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { unauthorized } from "@/lib/errors/api-error";

function getSecret(): string {
  const secret = process.env.DISPLAY_TOKEN_SECRET;
  if (!secret) {
    throw new Error("DISPLAY_TOKEN_SECRET tidak diset pada environment.");
  }
  return secret;
}

export function hashDisplayToken(raw: string): string {
  return createHmac("sha256", getSecret()).update(raw).digest("hex");
}

export function generateDisplayToken(): { raw: string; tokenHash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, tokenHash: hashDisplayToken(raw) };
}

/**
 * Memverifikasi token display & mencatat last_seen_at.
 * Token mentah tidak pernah disimpan; hanya HMAC-nya (Section 29 & 45).
 */
export async function authenticateDisplay(
  request: Request
): Promise<{ id: number; name: string }> {
  const url = new URL(request.url);
  const raw =
    request.headers.get("x-display-token") ?? url.searchParams.get("token");

  if (!raw) {
    throw unauthorized("Token display tidak ditemukan.");
  }

  const device = await prisma.displayDevice.findFirst({
    where: { displayToken: hashDisplayToken(raw), isActive: true },
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