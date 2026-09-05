import { toErrorResponse } from "./respond";

type Handler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

export function withErrorHandling<Args extends unknown[]>(
  handler: Handler<Args>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}