export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Token akses display (header `x-display-token`). */
  token?: string;
};

type ErrorBody = { error?: { code?: string; message?: string } };

export async function fetchJSON<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers["x-display-token"] = options.token;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError("Tidak dapat terhubung ke server.", "NETWORK_ERROR", 0);
  }

  const data = (await res.json().catch(() => null)) as ErrorBody | null;

  if (!res.ok) {
    throw new ApiClientError(
      data?.error?.message ?? "Terjadi kesalahan.",
      data?.error?.code ?? "SERVER_ERROR",
      res.status
    );
  }

  return data as T;
}