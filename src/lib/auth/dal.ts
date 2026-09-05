import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { decryptSession, getSessionCookie } from "./session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "OWNER";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getSessionCookie();
  const session = await decryptSession(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}