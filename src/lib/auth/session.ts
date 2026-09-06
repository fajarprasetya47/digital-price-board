import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "dpb_session";

export type SessionPayload = {
  userId: number;
  name: string;
  email: string;
  role: "OWNER";
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET tidak diset pada environment.");
  }
  return new TextEncoder().encode(secret);
}

function getSessionMaxAgeSeconds(): number {
  const raw = process.env.SESSION_MAX_AGE;
  const value = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("SESSION_MAX_AGE harus berupa angka positif (detik).");
  }
  return value;
}

export async function encryptSession(
  payload: SessionPayload
): Promise<{ token: string; expiresAt: Date }> {
  const maxAge = getSessionMaxAgeSeconds();
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getSecretKey());
  return { token, expiresAt };
}

export async function decryptSession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return {
      userId: payload.userId as number,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as "OWNER",
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const { token, expiresAt } = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: (process.env.APP_URL ?? "").startsWith("https://"),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}