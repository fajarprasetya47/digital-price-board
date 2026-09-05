import { withErrorHandling } from "@/lib/errors/handler";
import { deleteSession } from "@/lib/auth/session";
import { ok } from "@/lib/utils/api";

export const POST = withErrorHandling(async () => {
  await deleteSession();
  return ok({ success: true });
});