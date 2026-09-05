import "server-only";
import { ApiError, serverError } from "./api-error";
import { Prisma } from "../../../generated/prisma/client";

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(error.toBody(), { status: error.status });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Data sudah ada dan tidak boleh duplikat.",
          },
        },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Data tidak ditemukan." } },
        { status: 404 }
      );
    }
    if (error.code === "P2003") {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Referensi data tidak valid.",
          },
        },
        { status: 400 }
      );
    }
  }

  console.error("Unhandled error:", error);
  const err = serverError();
  return Response.json(err.toBody(), { status: err.status });
}