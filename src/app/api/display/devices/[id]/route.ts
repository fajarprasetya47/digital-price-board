import { withErrorHandling } from "@/lib/errors/handler";
import { ERROR_CODES, ApiError, notFound } from "@/lib/errors/api-error";
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
    showAllCategories: z.boolean().optional(),
    categoryIds: z
      .array(z.number().int().positive("ID kategori tidak valid."))
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Tidak ada field yang dikirim.");

export const PATCH = withErrorHandling(
  async (request: Request, ctx: RouteContext<"/api/display/devices/[id]">) => {
    await requireApiUser();

    const id = await getPositiveId(ctx.params);
    const existing = await prisma.displayDevice.findUnique({
      where: { id },
      select: {
        id: true,
        showAllCategories: true,
        categories: { select: { id: true } },
      },
    });
    if (!existing) {
      throw notFound("Perangkat display tidak ditemukan.");
    }

    const body = await readJson(request);
    const data = parseOrThrow(updateSchema, body);

    // System Plan V2 §17-18: validasi konfigurasi kategori.
    // Kategori nonaktif boleh dipilih (di UI hanya kategori aktif yang
    // ditawarkan); ia tetap tidak tampil di display karena
    // GET /api/display/prices hanya mengambil kategori aktif.
    const nextCategoryIds =
      data.categoryIds !== undefined
        ? [...new Set(data.categoryIds)]
        : existing.categories.map((c) => c.id);

    if (nextCategoryIds.length > 0) {
      const found = await prisma.category.findMany({
        where: { id: { in: nextCategoryIds } },
        select: { id: true },
      });
      if (found.length !== nextCategoryIds.length) {
        throw new ApiError(
          ERROR_CODES.VALIDATION_ERROR,
          "Satu atau lebih kategori tidak ditemukan.",
          { status: 422 }
        );
      }
    }

    const nextShowAll = data.showAllCategories ?? existing.showAllCategories;
    if (!nextShowAll && nextCategoryIds.length === 0) {
      throw new ApiError(
        ERROR_CODES.VALIDATION_ERROR,
        "Pilih minimal satu kategori untuk mode kategori tertentu.",
        { status: 422 }
      );
    }

    const device = await prisma.displayDevice.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.showAllCategories !== undefined
          ? { showAllCategories: data.showAllCategories }
          : {}),
        // §18: penggantian atomik; assignment dikosongkan saat kembali
        // ke mode semua kategori (§23) karena tidak digunakan.
        ...(data.categoryIds !== undefined || data.showAllCategories === true
          ? {
              categories: {
                set: data.showAllCategories === true ? [] : nextCategoryIds.map((cid) => ({ id: cid })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        showAllCategories: true,
        lastSeenAt: true,
        createdAt: true,
        categories: { select: { id: true, name: true } },
      },
    });

    return ok({
      device: {
        id: device.id,
        name: device.name,
        isActive: device.isActive,
        showAllCategories: device.showAllCategories,
        categoryIds: device.categories.map((c) => c.id),
        categories: device.categories,
        lastSeenAt: device.lastSeenAt,
        createdAt: device.createdAt,
      },
    });
  }
);
