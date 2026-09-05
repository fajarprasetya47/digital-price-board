import { withErrorHandling } from "@/lib/errors/handler";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { ok } from "@/lib/utils/api";

function toDto(device: {
  id: number;
  name: string;
  isActive: boolean;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: device.id,
    name: device.name,
    isActive: device.isActive,
    lastSeenAt: device.lastSeenAt,
    createdAt: device.createdAt,
  };
}

export const GET = withErrorHandling(async () => {
  await requireApiUser();

  const devices = await prisma.displayDevice.findMany({
    orderBy: [{ isActive: "desc" }, { id: "asc" }],
  });

  return ok({ devices: devices.map(toDto) });
});