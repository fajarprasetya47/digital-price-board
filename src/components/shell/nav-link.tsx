"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm"
          : "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
      }
    >
      {children}
    </Link>
  );
}