import { withErrorHandling } from "@/lib/errors/handler";
import {
  authenticateDisplay,
} from "@/lib/auth/display-token";
import { ok } from "@/lib/utils/api";

export const POST = withErrorHandling(async (request: Request) => {
  const device = await authenticateDisplay(request);
  return ok({ success: true, device });
});