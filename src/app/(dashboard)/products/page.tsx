import { requireUser } from "@/lib/auth/dal";

export default async function ProductsPage() {
  await requireUser();

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-xl font-bold text-zinc-900">Daftar Produk</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Halaman pengelolaan produk akan dibangun pada fase Frontend &
        Backend.
      </p>
    </div>
  );
}