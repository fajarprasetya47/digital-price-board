import { withErrorHandling } from "@/lib/errors/handler";
import { getCurrentUser } from "@/lib/auth/dal";
import { ok } from "@/lib/utils/api";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  return ok({ user });
});