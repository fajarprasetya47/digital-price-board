import { withErrorHandling } from "@/lib/errors/handler";
import { validationError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { readJson, ok } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { changePasswordSchema } from "@/lib/validation/auth";

export const PATCH = withErrorHandling(async (request: Request) => {
  const user = await requireApiUser();

  const body = await readJson(request);
  const { currentPassword, newPassword } = parseOrThrow(
    changePasswordSchema,
    body
  );

  const found = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!found || !(await verifyPassword(currentPassword, found.passwordHash))) {
    throw validationError("Password lama salah.");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return ok({ success: true });
});