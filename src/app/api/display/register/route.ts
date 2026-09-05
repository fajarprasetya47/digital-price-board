import { withErrorHandling } from "@/lib/errors/handler";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { generateDisplayToken } from "@/lib/auth/display-token";
import { readJson, created } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { registerDisplaySchema } from "@/lib/validation/display";

export const POST = withErrorHandling(async (request: Request) => {
  await requireApiUser();

  const body = await readJson(request);
  const { name } = parseOrThrow(registerDisplaySchema, body);

  const { raw, tokenHash } = generateDisplayToken();

  const device = await prisma.displayDevice.create({
    data: { name, displayToken: tokenHash, isActive: true },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  const baseUrl = process.env.APP_URL ?? "";
  const displayUrl = `${baseUrl}/display/${raw}`;

  return created({
    device,
    token: raw,
    displayUrl,
  });
});