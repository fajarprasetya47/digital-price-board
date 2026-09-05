import { withErrorHandling } from "@/lib/errors/handler";
import { unauthorized } from "@/lib/errors/api-error";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { readJson, ok } from "@/lib/utils/api";
import { parseOrThrow } from "@/lib/validation";
import { loginSchema } from "@/lib/validation/auth";

export const POST = withErrorHandling(async (request: Request) => {
  const body = await readJson(request);
  const { email, password } = parseOrThrow(loginSchema, body);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized("Email atau password salah.");
  }

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return ok({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});