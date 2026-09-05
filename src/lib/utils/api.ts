import "server-only";
import { validationError } from "@/lib/errors/api-error";

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw validationError("Body request bukan JSON yang valid.");
  }
}

export function notImplemented(
  message = "Endpoint belum diimplementasikan."
): Response {
  return Response.json(
    { error: { code: "SERVER_ERROR", message } },
    { status: 501 }
  );
}