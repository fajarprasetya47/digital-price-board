import { withErrorHandling } from "@/lib/errors/handler";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/utils/api";

function toDto(device: {
  id: number;
  name: string;
  isActive: boolean;
  showAllCategories: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  categories: { id: number; name: string }[];
}) {
  return {
    id: device.id,
    name: device.name,
    isActive: device.isActive,
    showAllCategories: device.showAllCategories,
    categoryIds: device.categories.map((c) => c.id),
    categories: device.categories,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
  };
}

export const GET = withErrorHandling(async () => {
  await requireApiUser();

  const devices = await prisma.displayDevice.findMany({
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
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

  return ok({ devices: devices.map(toDto) });
});