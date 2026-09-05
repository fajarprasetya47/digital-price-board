export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options: { status?: number; details?: unknown } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? DEFAULT_STATUS[code];
    this.details = options.details;
  }

  toBody() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details !== undefined ? { details: this.details } : {}),
      },
    };
  }
}

export const validationError = (
  message: string,
  details?: unknown
): ApiError =>
  new ApiError(ERROR_CODES.VALIDATION_ERROR, message, { details });

export const unauthorized = (message = "Autentikasi diperlukan."): ApiError =>
  new ApiError(ERROR_CODES.UNAUTHORIZED, message);

export const forbidden = (message = "Tidak memiliki akses."): ApiError =>
  new ApiError(ERROR_CODES.FORBIDDEN, message);

export const notFound = (message = "Data tidak ditemukan."): ApiError =>
  new ApiError(ERROR_CODES.NOT_FOUND, message);

export const serverError = (
  message = "Terjadi kesalahan pada server."
): ApiError => new ApiError(ERROR_CODES.SERVER_ERROR, message);