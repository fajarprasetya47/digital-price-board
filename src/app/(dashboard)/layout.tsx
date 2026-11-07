import { getCurrentUser } from "@/lib/auth/dal";
import { NavLink } from "@/components/shell/nav-link";
import { LogoutButton } from "@/components/shell/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-stone-100">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-base font-bold tracking-tight text-zinc-900">
              Digital Price Board
            </span>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink href="/products">Produk</NavLink>
              <NavLink href="/categories">Kategori</NavLink>
              <NavLink href="/display-devices">Display</NavLink>
              <NavLink href="/settings">Pengaturan</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            {user && (
              <span className="hidden truncate sm:inline">{user.name}</span>
            )}
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Owner
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-zinc-200 bg-stone-100 px-4 py-3 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Digital Price Board</p>
        <p className="mt-0.5 font-medium text-zinc-600">Created by Japrasetya</p>
      </footer>

      <nav className="sticky bottom-0 z-10 border-t border-zinc-200 bg-white sm:hidden">
        <div className="flex items-center justify-around py-1">
          <NavLink href="/products">Produk</NavLink>
          <NavLink href="/categories">Kategori</NavLink>
          <NavLink href="/display-devices">Display</NavLink>
          <NavLink href="/settings">Setelan</NavLink>
        </div>
      </nav>
    </div>
  );
}