import { withErrorHandling } from "@/lib/errors/handler";
import { notFound } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { readJson, ok } from "@/lib/utils/api";
import { getPositiveId } from "@/lib/utils/params";
import { z } from "zod";
import { parseOrThrow } from "@/lib/validation";

const updateSchema = z
  .object({
    name: z.string().trim().min(1, "Nama display wajib diisi.").optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Tidak ada field yang dikirim.");

export const PATCH = withErrorHandling(
  async (request: Request, ctx: RouteContext<"/api/display/devices/[id]">) => {
    await requireApiUser();

    const id = await getPositiveId(ctx.params);
    const existing = await prisma.displayDevice.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw notFound("Perangkat display tidak ditemukan.");
    }

    const body = await readJson(request);
    const data = parseOrThrow(updateSchema, body);

    const device = await prisma.displayDevice.update({
      where: { id },
      data,
    });

    return ok({
      device: {
        id: device.id,
        name: device.name,
        isActive: device.isActive,
        lastSeenAt: device.lastSeenAt,
        createdAt: device.createdAt,
      },
    });
  }
);