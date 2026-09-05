import { NextRequest, NextResponse } from "next/server";
import { decryptSession } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/auth/session";

const protectedPaths = [
  "/dashboard",
  "/products",
  "/categories",
  "/display-devices",
  "/settings",
];

const publicPaths = ["/login"];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(cookie);

  const isProtected = protectedPaths.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (isProtected && !session) {
    const url = new URL("/login", request.nextUrl);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (publicPaths.includes(path) && session) {
    return NextResponse.redirect(new URL("/products", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};